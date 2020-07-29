const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itemSchema = new Schema({ //defines the structure of each doc
    _id: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    title: {
        type: String,
        required: false
    },
    component: {
        type: String,
        required: true
    },
    asin: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: false 
    },
    price: {
        type: Number,
        required: true 
    },
    brand: {
        type: String,
        required: true
    },
    images: {
        type: Array,
        "default": [],
        required: true
    },

});

//model sorrounds the schema and provides an interface to communicate with a collection for docs matching the schema
const Item = mongoose.model('item', itemSchema); //(!) looks for the plural of this string  by default,
module.exports = Item;