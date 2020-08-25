const {Router} = require('express');
const clientController = require('./Controllers/clientController');
const routes = Router();
const restaurantController = require('./Controllers/restaurantController');
const foodController = require('./Controllers/foodController');
const cartController = require('./Controllers/cartController');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, "image.jpg");
  }
});

const fileFilter = (req, file, cb) => {
    // reject a file
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };

const upload = multer({
    storage: storage,
    limits: {
      fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
  });
  

//users
routes.post('/clientsCreate', upload.single('productImage'), clientController.create);
routes.post('/clientsUpdate', clientController.update);
routes.post('/login', clientController.login);
routes.post('/addAdress', clientController.addAdress);
routes.get('/listAdress', clientController.listAdress);
routes.post('/doOrder', clientController.do_order);
routes.get('/filterOrders', clientController.filterOrders);
routes.get('/user/:id', clientController.findUser);




//restaurant
routes.post('/status', restaurantController.status);
routes.post('/frete', restaurantController.frete);
routes.post('/restaurantCreate', upload.single('productImage'), restaurantController.create);
routes.get('/restaurants', restaurantController.index);
routes.get('/delivery', restaurantController.delivery);
routes.get('/populars', restaurantController.popular);
routes.get('/maisPedidos', restaurantController.maisPedidos);
routes.get('/categs/:id', restaurantController.searchBycateg);
routes.get('/restaurants/:id', restaurantController.getbyId);
routes.get('/restaurantsByName', restaurantController.searchByName);
routes.get('/promotion', restaurantController.promotion);
routes.get('/rel1', restaurantController.rel1);
routes.get('/rel2', restaurantController.rel2);
routes.get('/rel3', restaurantController.rel3);
routes.get('/teste', restaurantController.teste);

//foods
routes.post('/foodCreate', upload.single('productImage'), foodController.foodCreate);
routes.post('/foodUpdate', foodController.updateFood);
routes.post('/update', foodController.update);
routes.delete('/foodDelete/:id', foodController.deleteFood);
routes.get('/searchFood', foodController.searchFood);
routes.get('/menu', foodController.menu);

routes.get('/foods/:id', foodController.indexOne);

//carrinho
routes.get('/carrinho', cartController.index);
routes.post('/carrinho', cartController.add);
routes.delete('/carrinho', cartController.remove);

//categorias
routes.get('/categs', restaurantController.categs);

routes.post('/sendImage', upload.single('productImage'), (req, res, next)=>{
    console.log(req.body)
    res.send(req.file);
});


module.exports = routes;