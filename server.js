const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use('/uploads', express.static('uploads')); 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('productImage'), (req, res) => {
  const { productName, productDescription, productPrice } = req.body;
  const productData = {
    name: productName,
    description: productDescription,
    image: req.file.filename,
    price: productPrice, 
    user: req.session && req.session.user ? req.session.user.username : "Người dùng không xác định"
  };

  fs.readFile('products.json', (err, data) => {
    let products = [];
    if (!err) {
      products = JSON.parse(data);
    }
    products.push(productData);
    
    fs.writeFile('products.json', JSON.stringify(products), (err) => {
      if (err) {
        return res.status(500).send('Lỗi lưu sản phẩm!');
      }
      res.send('Sản phẩm đã được tải lên thành công!');
    });
  });
});

app.get('/products', (req, res) => {
  fs.readFile('products.json', (err, data) => {
    if (err) {
      return res.status(500).send('Lỗi đọc dữ liệu sản phẩm!');
    }
    const products = JSON.parse(data);
    res.json(products);
  });
});

app.delete('/products/:index', (req, res) => {
  const index = req.params.index;

  fs.readFile('products.json', (err, data) => {
    if (err) {
      return res.status(500).send('Lỗi đọc dữ liệu sản phẩm!');
    }
    const products = JSON.parse(data);
    
    if (index < 0 || index >= products.length) {
      return res.status(404).send('Sản phẩm không tồn tại!');
    }

    products.splice(index, 1);
    
    fs.writeFile('products.json', JSON.stringify(products), (err) => {
      if (err) {
        return res.status(500).send('Lỗi lưu dữ liệu!');
      }
      res.send('Sản phẩm đã được xóa thành công!');
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
