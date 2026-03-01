#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_DIR}/.env"
BACKUP_DIR="${PROJECT_DIR}/backups"

log() {
    local level="$1"
    local message="$2"
    local timestamp
    timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] [$level] $message" >echo "[$timestamp] [$level] $message"2
}

log_info() { log "INFO" "$1"; }
log_warn() { log "WARN" "$1"; }
log_error() { log "ERROR" "$1"; }

show_help() {
    cat << EOF
Haugalandsved Restore Script
===========================

Usage: $(basename "$0") [OPTIONS] <backup-file>

Restores PocketBase data from a backup file.

Commands:
    list                    List available backups
    info <file>             Show backup info without restoring
    extract <file>          Extract backup to temp directory
    restore <file>          Full restore to PocketBase
    dry-restore <file>      Show what would be restored

Options:
    -h, --help              Show this help message
    -v, --verbose           Enable verbose output
    -c, --collection NAME   Restore specific collection only (can be repeated)
    --skip-collections      Skip collection data restore (schema only)
    --target-dir DIR        Extract to specific directory
    --keep-extracted        Keep extracted files after restore

Environment Variables for Restore:
    PB_ADMIN_EMAIL          PocketBase admin email
    PB_ADMIN_PASSWORD       PocketBase admin password
    PB_URL                  PocketBase URL (default: https://db.haugalandsved.no)

Examples:
    $(basename "$0") list                       # List available backups
    $(basename "$0") info backup.tar.gz         # Show backup contents
    $(basename "$0") extract backup.tar.gz      # Extract backup
    $(basename "$0") restore backup.tar.gz      # Full restore

Warning:
    The restore operation will REPLACE existing data in PocketBase.
    Make sure to backup current data before restoring.

EOF
}

check_dependencies() {
    local missing=()
    local deps=("curl" "jq" "tar")
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing+=("$dep")
        fi
    done
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        echo "ERROR: Missing required dependencies: ${missing[*]}"
        exit 2
    fi
}

load_env() {
    if [[ -f "$ENV_FILE" ]]; then
        set -a
        source "$ENV_FILE"
        set +a
    fi
    
    ENV_BACKUP_FILE="${PROJECT_DIR}/.env.backup"
    if [[ -f "$ENV_BACKUP_FILE" ]]; then
        set -a
        source "$ENV_BACKUP_FILE"
        set +a
    fi
}

validate_env_for_restore() {
    local missing=()
    local required=("PB_ADMIN_EMAIL" "PB_ADMIN_PASSWORD")
    
    for var in "${required[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing+=("$var")
        fi
    done
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing required environment variables: ${missing[*]}"
        exit 3
    fi
}

list_backups() {
    log_info "Available backups in $BACKUP_DIR:"
    echo ""
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        echo "No backups directory found"
        return 0
    fi
    
    local backups
    backups=$(find "$BACKUP_DIR" -name "haugalandsved-backup-*.tar.gz" -type f | sort -r)
    
    if [[ -z "$backups" ]]; then
        echo "No backups found"
        return 0
    fi
    
    printf "%-45s %12s %20s\n" "FILENAME" "SIZE" "MODIFIED"
    printf "%s\n" "-------------------------------------------------------------------------------"
    
    while IFS= read -r backup; do
        local filename size modified
        filename=$(basename "$backup")
        size=$(du -h "$backup" | cut -f1)
        modified=$(stat -c "%y" "$backup" 2>/dev/null | cut -d'.' -f1)
        printf "%-45s %12s %20s\n" "$filename" "$size" "$modified"
    done <<< "$backups"
}

extract_archive() {
    local archive_file="$1"
    local target_dir="${2:-}"
    
    if [[ -z "$target_dir" ]]; then
        target_dir=$(mktemp -d)
    fi
    
    log_info "Extracting archive to: $target_dir"
    
    tar -xzf "$archive_file" -C "$target_dir"
    
    local extracted_dir
    extracted_dir=$(find "$target_dir" -maxdepth 1 -type d -name "haugalandsved-backup-*" | head -1)
    
    if [[ -z "$extracted_dir" ]]; then
        log_error "Could not find extracted backup directory"
        exit 1
    fi
    
    log_info "Extracted to: $extracted_dir"
    echo "$extracted_dir"
}

show_backup_info() {
    local backup_file="$1"
    local temp_dir
    
    temp_dir=$(mktemp -d)
    trap "rm -rf $temp_dir" EXIT
    
    local extracted_dir
    extracted_dir=$(extract_archive "$backup_file" "$temp_dir")
    
    echo ""
    echo "=========================================="
    echo "        BACKUP INFORMATION"
    echo "=========================================="
    echo ""
    
    local backup_name
    backup_name=$(basename "$extracted_dir")
    echo "Backup Name: $backup_name"
    echo ""
    
    echo "Collections:"
    echo "------------"
    
    for json_file in "$extracted_dir"/*.json; do
        local name size
        name=$(basename "$json_file" .json)
        size=$(jq 'length' "$json_file" 2>/dev/null || echo "N/A")
        printf "  %-20s %s records\n" "$name" "$size"
    done
    
    echo ""
    
    if [[ -f "${extracted_dir}/.env" ]]; then
        echo "Includes: .env file"
        echo ""
    fi
    
    local collections_file="${extracted_dir}/_collections.json"
    if [[ -f "$collections_file" ]]; then
        echo "Schema Info:"
        echo "------------"
        jq -r '.[] | "  \(.name): \(.type) (\(.fields | length) fields)"' "$collections_file" 2>/dev/null || true
    fi
    
    echo ""
}

pb_authenticate() {
    local pb_url="${PB_URL:-https://db.haugalandsved.no}"
    
    log_info "Authenticating with PocketBase at $pb_url"
    
    local response
    local http_code
    
    response=$(curl -s -w "\n%{http_code}" -X POST \
        "${pb_url}/api/collections/_superusers/auth-with-password" \
        -H "Content-Type: application/json" \
        -d "{\"identity\":\"${PB_ADMIN_EMAIL}\",\"password\":\"${PB_ADMIN_PASSWORD}\"}")
    
    http_code=$(echo "$response" | tail -n 1)
    response=$(echo "$response" | sed '$d')
    
    if [[ "$http_code" != "200" ]]; then
        log_error "PocketBase authentication failed (HTTP $http_code)"
        exit 6
    fi
    
    PB_TOKEN=$(echo "$response" | jq -r '.token')
    
    if [[ -z "$PB_TOKEN" || "$PB_TOKEN" == "null" ]]; then
        log_error "Failed to extract auth token"
        exit 6
    fi
    
    log_info "Authenticated successfully"
}

restore_collection() {
    local collection="$1"
    local data_file="$2"
    local dry_run="${3:-false}"
    local pb_url="${PB_URL:-https://db.haugalandsved.no}"
    
    if [[ ! -f "$data_file" ]]; then
        log_warn "Data file not found for collection '$collection'"
        return 0
    fi
    
    local record_count
    record_count=$(jq 'length' "$data_file")
    
    log_info "Restoring collection '$collection' ($record_count records)"
    
    if [[ "$dry_run" == "true" ]]; then
        log_info "[DRY RUN] Would restore $record_count records to '$collection'"
        return 0
    fi
    
    local records
    records=$(jq -c '.[]' "$data_file")
    
    local success=0
    local failed=0
    
    while IFS= read -r record; do
        local id
        id=$(echo "$record" | jq -r '.id')
        
        local response
        local http_code
        
        response=$(curl -s -w "\n%{http_code}" \
            "${pb_url}/api/collections/${collection}/records/${id}" \
            -H "Authorization: ${PB_TOKEN}" \
            -H "Content-Type: application/json" \
            -X PUT \
            -d "$record")
        
        http_code=$(echo "$response" | tail -n 1)
        
        if [[ "$http_code" == "200" ]]; then
            ((success++))
        else
            response=$(curl -s -w "\n%{http_code}" \
                "${pb_url}/api/collections/${collection}/records" \
                -H "Authorization: ${PB_TOKEN}" \
                -H "Content-Type: application/json" \
                -X POST \
                -d "$record")
            
            http_code=$(echo "$response" | tail -n 1)
            
            if [[ "$http_code" == "200" || "$http_code" == "201" ]]; then
                ((success++))
            else
                ((failed++))
                if [[ $failed -le 5 ]]; then
                    log_warn "Failed to restore record $id in '$collection' (HTTP $http_code)"
                fi
            fi
        fi
    done <<< "$records"
    
    log_info "Collection '$collection': $success restored, $failed failed"
}

restore_collections() {
    local extracted_dir="$1"
    local dry_run="${2:-false}"
    local specific_collections="${3:-}"
    
    local collections_to_restore
    
    if [[ -n "$specific_collections" ]]; then
        IFS=',' read -ra collections_to_restore <<< "$specific_collections"
    else
        collections_to_restore=("users" "orders" "inventory" "campaigns")
    fi
    
    log_info "Restoring collections: ${collections_to_restore[*]}"
    
    for collection in "${collections_to_restore[@]}"; do
        local data_file="${extracted_dir}/${collection}.json"
        restore_collection "$collection" "$data_file" "$dry_run"
    done
}

run_restore() {
    local backup_file="$1"
    local dry_run="${2:-false}"
    local skip_collections="${3:-false}"
    local specific_collections="${4:-}"
    local keep_extracted="${5:-false}"
    local target_dir="${6:-}"
    
    validate_env_for_restore
    
    local temp_dir
    if [[ -n "$target_dir" ]]; then
        temp_dir="$target_dir"
        mkdir -p "$temp_dir"
    else
        temp_dir=$(mktemp -d)
    fi
    
    if [[ "$keep_extracted" != "true" && -z "$target_dir" ]]; then
        trap "rm -rf $temp_dir" EXIT
    fi
    
    local extracted_dir
    extracted_dir=$(extract_archive "$backup_file" "$temp_dir")
    
    if [[ "$dry_run" == "true" ]]; then
        show_backup_info "$backup_file"
        log_info "[DRY RUN] Would restore the above data to PocketBase"
        return 0
    fi
    
    pb_authenticate
    
    if [[ "$skip_collections" != "true" ]]; then
        restore_collections "$extracted_dir" "$dry_run" "$specific_collections"
    else
        log_info "Skipping collection data restore"
    fi
    
    log_info "Restore completed successfully"
}

run_extract() {
    local backup_file="$1"
    local target_dir="${2:-}"
    
    local temp_dir
    if [[ -n "$target_dir" ]]; then
        temp_dir="$target_dir"
        mkdir -p "$temp_dir"
    else
        temp_dir=$(mktemp -d)
        echo "Extracting to: $temp_dir"
    fi
    
    extract_archive "$backup_file" "$temp_dir"
    
    log_info "Files extracted to: $temp_dir"
}

parse_args() {
    if [[ $# -eq 0 ]]; then
        show_help
        exit 0
    fi
    
    local command=""
    local backup_file=""
    local specific_collections=""
    local target_dir=""
    local skip_collections=false
    local keep_extracted=false
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                set -x
                shift
                ;;
            -c|--collection)
                if [[ -n "$specific_collections" ]]; then
                    specific_collections="${specific_collections},$2"
                else
                    specific_collections="$2"
                fi
                shift 2
                ;;
            --skip-collections)
                skip_collections=true
                shift
                ;;
            --target-dir)
                target_dir="$2"
                shift 2
                ;;
            --keep-extracted)
                keep_extracted=true
                shift
                ;;
            list)
                command="list"
                shift
                ;;
            info)
                command="info"
                shift
                if [[ $# -gt 0 && ! "$1" =~ ^- ]]; then
                    backup_file="$1"
                    shift
                fi
                ;;
            extract)
                command="extract"
                shift
                if [[ $# -gt 0 && ! "$1" =~ ^- ]]; then
                    backup_file="$1"
                    shift
                fi
                ;;
            restore)
                command="restore"
                shift
                if [[ $# -gt 0 && ! "$1" =~ ^- ]]; then
                    backup_file="$1"
                    shift
                fi
                ;;
            dry-restore)
                command="dry-restore"
                shift
                if [[ $# -gt 0 && ! "$1" =~ ^- ]]; then
                    backup_file="$1"
                    shift
                fi
                ;;
            *)
                if [[ -z "$backup_file" ]]; then
                    backup_file="$1"
                fi
                shift
                ;;
        esac
    done
    
    case "$command" in
        list)
            list_backups
            ;;
        info)
            if [[ -z "$backup_file" ]]; then
                log_error "No backup file specified"
                exit 1
            fi
            show_backup_info "$backup_file"
            ;;
        extract)
            if [[ -z "$backup_file" ]]; then
                log_error "No backup file specified"
                exit 1
            fi
            run_extract "$backup_file" "$target_dir"
            ;;
        restore)
            if [[ -z "$backup_file" ]]; then
                log_error "No backup file specified"
                exit 1
            fi
            run_restore "$backup_file" "false" "$skip_collections" "$specific_collections" "$keep_extracted" "$target_dir"
            ;;
        dry-restore)
            if [[ -z "$backup_file" ]]; then
                log_error "No backup file specified"
                exit 1
            fi
            run_restore "$backup_file" "true"
            ;;
        "")
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

main() {
    check_dependencies
    load_env
    parse_args "$@"
}

main "$@"
