const db = require('../db/db_connection');
const gdrive = require('../../utils/gdrive');
const base64ToImage = require('base64-to-image');


module.exports = {

    async foodCreate(req, res, next){

        const { restid, name, price, description } = req.body;
        const productImage = req.file;

        console.log(req);

        gdrive.imageUpload(`${name}.png`, "./uploads/image.jpg", async (link) => {
        
            const insert = await db.query(
                'INSERT INTO foods_restaurant (restid, name, price, description, image) VALUES ($1,$2,$3,$4,$5)',
                [restid, name, price, description, link]
            );


            const {rows} = await db.query(
                'SELECT * FROM foods_restaurant WHERE restid=$1',
                [restid]
            );

            console.log(rows);
            res.send(rows);
        });


    },

    async updateFood(req, res){

        const {id, price, name, description, restid} = req.body;

        console.log(id, price, restid);

        const now = new Date();

        try{
        
            let {rows} = await db.query(
                'SELECT * FROM foods_restaurant WHERE id=$1',
                [id]
            );
            
            function roundToXDigits(value, digits) {
                if(!digits){
                    digits = 2;
                }
                value = value * Math.pow(10, digits);
                value = Math.round(value);
                value = value / Math.pow(10, digits);
                return value;
            }

            //console.log(rows);
            let percent;
            console.log(price);
            if(price < rows[0].price){

                percent = 100 - 100*price/rows[0].price;

            }else {
                percent = 100*price/rows[0].price;

            }
            percent = roundToXDigits(percent, 1);
            console.log(percent);

            
            const desc1 = await db.query(
                'SELECT * FROM desconto WHERE food=$1',
                 [id]
            );
            
        
            if(desc1.rows.length){
                rows = await db.query(
                    'UPDATE desconto SET validade=false WHERE food=$1',
                    [id]
                );
               
            }
                

            const desc2 = await db.query(
                'INSERT INTO desconto (percent, data, food, validade, restid) VALUES ($1, $2, $3, $4, $5)',
                [percent, now, id, true, restid]
            );

            const alter = await db.query(
                'UPDATE foods_restaurant SET name=$2, description=$3 WHERE id=$1',
                [id, name, description]
            );

        }catch(e){
            console.log(e);
        }

        res.send({mnsg: "preço atualizado"})

    },

    async deleteFood(req, res){
        const {id} = req.params;

        const deleted = await db.query(
            'DELETE FROM desconto WHERE food=$1',
            [id]
        );

        const {rows} = await db.query(
            'UPDATE foods_restaurant SET restid=null WHERE id=$1',
            [id]
        );


        console.log(rows);
        res.send(rows);
    },

    async searchFood(req, res){
        
        const {id} = req.query;
        
        const {rows} = await db.query(
            'SELECT * FROM foods_restaurant WHERE id=$1',
            [id]
        );


        res.send(rows);

    },

    async menu(req, res){

        const {id} = req.query;

        const menu = [];
        
        const {rows} = await db.query(
            'SELECT * FROM foods_restaurant WHERE restid = $1',
            [id]
        );

        for(let i = 0; i < rows.length; i++){

            const promo = await db.query(
                'SELECT * FROM desconto WHERE food = $1 AND validade=$2',
                [rows[i].id, true]
            );

            if(promo.rows.length){
                menu.push({
                        restid: Number(id),
                        id: rows[i].id,
                        name: rows[i].name, 
                        price: rows[i].price, 
                        description: rows[i].description, 
                        image: rows[i].image,
                        percent: promo.rows[0].percent/100});
            }
            else{
                menu.push({
                    restid: Number(id),
                    id: rows[i].id,
                    name: rows[i].name, 
                    price: rows[i].price, 
                    description: rows[i].description, 
                    image: rows[i].image,
                    percent: 0/100});
            }    

        }

        res.send(menu);

    },

    async indexCar(req, res){

        try{
            const { rows } = await db.query('SELECT * FROM car', []);

            res.send(rows);
        }catch(e){
            res.send({err: e});
        }

    },

    async insertFood(req, res){

        const {food, client} = req.body;

        try{

            const insert = await db.query(
                'INSERT INTO car (food, qnt, client) VALUES ($1,$2,$3)',
                [food, 1, client]
            );

            res.send({msg: "Food inserted in car"});

        }catch(e){
            res.send({err: e});
        }

    },

    async deleteFoodInCar(req, res){

        const {food} = req.query;

        try{
            const {rows} = await db.query(
                'DELETE FROM car WHERE food=$1',
                [food]
            );

            res.send({msg: "Food deleted"});
        }catch(e){
            res.send({err:e});
        }

    },

    async addQntInCar(req, res){

        const {food, qnt} = req.body;

        try{
            const {rows} = await db.query(
                'SELECT * FROM car WHERE food=$1',
                [food]
            );

            const newQnt = rows[0].qnt + qnt;

            const add = await db.query(
                'UPDATE car SET qnt=$2 WHERE food=$1',
                [food, newQnt]
            );

            res.send({msg: "Food Incremented"});
        }catch(e){
            res.send({err: e});
        }
    },

    async indexOne(req, res){

        const { id } = req.params;

        const { rows } = await db.query(
            'SELECT * FROM foods_restaurant WHERE id=$1', [id]
        )

        res.send(rows);

    },

    async update(req, res){

        const { id, name, description } = req.body;

        let { rows } = await db.query(
            'UPDATE foods_restaurant SET name=$1 WHERE id=$2', [name, id]
        )

        rows = await db.query(
            'UPDATE foods_restaurant SET description=$1 WHERE id=$2', [description, id]
        )
        

        res.send(rows);

    }
}