const { json } = require("express");
const Products = require("../models/productModel");

class APIfeatures {
  constructor(query, queryString ) {
    this.query = query;
    this.queryString = queryString;
  }
  filtering() {
    const queryObj = { ...this.queryString };

    const excludedFields = ["page", "sort", "limit"];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);

    queryStr = queryStr.replace(
      /\b(gte|gt|lt|lte|regex)\b/g,
      (match) => "$" + match
    );
this.query = this.query.find(JSON.parse(queryStr));

    return this;

  }
  sorting() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join("");
     
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }
  pagination() {
    const page = this.queryString.page * 1 || 1;

    const limit = this.queryString.limit * 1 || 9;

    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

const productController = {
  getProducts: async (req, res) => {
    try {
      const features = new APIfeatures(Products.find(), req.query)
        .filtering()
        .sorting()
.pagination()
        ;

      const products = await features.query.exec();
      console.log('Retrieved Products:', products);

      res.json({  products });
    } 
    catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  createProducts: async (req, res) => {
    try {
      const {
        product_id,
        title,
        price,
        description,
        content,
        images,
        category,
      } = req.body;

      if (!images) return res.status(400).json({ msg: "No Image Uploaded" });

      const product = await Products.findOne({ product_id });

      if (product)
        return res.status(400).json({ msg: "Product Already Exist" });

      const newProduct = new Products({
        product_id,
        title,
        price,
        description,
        content,
        images,
        category,
      });

      await newProduct.save();
      res.json({ msg: "Product Created" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  deleteProducts: async (req, res) => {
    try {
      await Products.findByIdAndDelete(req.params.id);
      res.json({ msg: "Deleted a Product" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  updateProducts: async (req, res) => {
    try {
      const { title, price, description, content, images, category } = req.body;

      if (!images) return res.status(500).json({ msg: "No Image upload" });

      await Products.findOneAndUpdate(
        { _id: req.params.id },
        {
          title,
          price,
          description,
          content,
          images,
          category,
        }
      );

      res.json({ msg: "Updated" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
};
module.exports = productController;
