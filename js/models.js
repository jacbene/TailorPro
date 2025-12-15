// Modèles de données
const BusinessModels = {
    Client: {
        id: '',
        firstName: '',
        lastName: '', 
        phone: '',
        email: '',
        address: {
            street: '',
            city: '',
            zipCode: ''
        },
        measurements: {}, // Référence aux mesures
        notes: '',
        createdAt: '',
        updatedAt: ''
    },
    
    Creation: {
        id: '',
        name: '',
        description: '',
        category: '',
        baseCost: 0,
        materialsCost: 0,
        laborCost: 0,
        totalCost: 0,
        imageUrl: '',
        tags: [],
        createdAt: '',
        updatedAt: ''
    },
    
    Order: {
        id: '',
        clientId: '',
        creationId: '',
        totalAmount: 0,
        amountPaid: 0,
        remainingAmount: 0,
        status: 'pending', // pending, in_progress, completed, delivered, cancelled
        priority: 'medium', // low, medium, high
        dueDate: '',
        clientMeasurements: {},
        notes: '',
        payments: [], // Historique des paiements
        createdAt: '',
        updatedAt: ''
    },
    
    Payment: {
        id: '',
        orderId: '',
        amount: 0,
        paymentMethod: 'cash', // cash, mobile_money, bank_transfer, card
        notes: '',
        date: ''
    },
    
    Measurement: {
        id: '',
        clientId: '',
        name: '', // Ex: "Robe été 2024"
        measurements: {
            // Mesures standard
            bust: 0,
            waist: 0,
            hips: 0,
            shoulderWidth: 0,
            armLength: 0,
            // Mesures personnalisées
            custom: {}
        },
        notes: '',
        createdAt: ''
    }
};
