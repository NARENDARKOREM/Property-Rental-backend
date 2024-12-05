const TblFav = require('../models/TblFav');
const Property = require('../models/Property');

// Add to Favorites
const addToFavorites = async (req, res) => {
    const { property_id, property_type } = req.body;
    const uid = req.user.id; // Get the user ID from the authenticated user

    try {
        // Check if the property exists
        const propertyExists = await Property.findByPk(property_id);
        if (!propertyExists) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Check if the property is already in favorites
        const existingFavorite = await TblFav.findOne({ where: { uid, property_id } });
        if (existingFavorite) {
            return res.status(400).json({ error: 'Property already in favorites' });
        }

        // Add to favorites
        const newFavorite = await TblFav.create({
            uid,
            property_id,
            property_type
        });

        res.status(201).json({ message: 'Property added to favorites successfully', newFavorite });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};


// Get Favorite Properties
const getFavoriteProperties = async (req, res) => {
    const uid = req.user.id; // Get the user ID from the authenticated user

    try {
        const favorites = await TblFav.findAll({ where: { uid } });
        const result = await Promise.all(favorites.map(async (favorite) => {
            const property = await Property.findByPk(favorite.property_id);
            return {
                id: favorite.id,
                property_id: favorite.property_id,
                property_type: favorite.property_type,
                property_title: property.title,
                property_image: property.image
            };
        }));

        res.status(200).json({ message: 'Favorite properties retrieved successfully', favorites: result });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Remove from Favorites
const removeFromFavorites = async (req, res) => {
    const { id } = req.params;
    const { forceDelete } = req.query; // Add query parameter for hard delete
    const uid = req.user.id; // Get the user ID from the authenticated user

    try {
        const favorite = await TblFav.findOne({ where: { id, uid } });
        if (!favorite) {
            return res.status(404).json({ error: 'Favorite property not found' });
        }

        if (forceDelete === 'true') {
            await favorite.destroy({ force: true }); // Hard delete
            res.status(200).json({ message: 'Property permanently removed from favorites' });
        } else {
            await favorite.destroy(); // Soft delete
            res.status(200).json({ message: 'Property removed from favorites' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

module.exports = {
    addToFavorites,
    getFavoriteProperties,
    removeFromFavorites
};
