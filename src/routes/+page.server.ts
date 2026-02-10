import { pb } from '$lib/pocketbase';

export const load = async () => {
    try {
        const [inventory, campaigns] = await Promise.all([
            pb.collection('inventory').getOne('6svgilvrehzayhb'),
            pb.collection('campaigns').getFullList({
                filter: 'isActive = true',
                sort: '-created',
                requestKey: null
            })
        ]);

        const now = new Date();
        const activeCampaign = campaigns.find(
            (c) => new Date(c.endDate) >= now
        );

        return {
            inventory: {
                quantity: inventory.quantity_available,
                isInStock: inventory.isInStock
            },
            campaign: activeCampaign
                ? {
                      id: activeCampaign.id,
                      isActive: true,
                      label: activeCampaign.label,
                      campaignPrice: activeCampaign.campaignPrice,
                      standardPrice: activeCampaign.standardPrice,
                      endDate: activeCampaign.endDate
                  }
                : null
        };
    } catch (e) {
        console.error('Kunne ikkje laste data:', e);
        return {
            inventory: {
                quantity: 0,
                isInStock: false
            },
            campaign: null
        };
    }
};
