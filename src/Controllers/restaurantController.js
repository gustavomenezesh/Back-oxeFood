const db = require('../db/db_connection');
const { response } = require('express');
const gdrive = require('../../utils/gdrive');
const base64ToImage = require('base64-to-image');


module.exports = {

    async create(req, res){
        const {name, email, adress, pass, categ, status, tipo, entrega} = req.body;
        const productImage = req.file;

        gdrive.imageUpload(`${name}.png`, "./uploads/image.jpg", async (link) => {

            let {rows} = await db.query(
                'INSERT INTO restaurants (name, email, adress,pass, categ, status, tipo, image, entrega) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                [name, email, adress, pass, categ, status, tipo, link, entrega]
            );

            rows = await db.query(
                'SELECT * FROM restaurants WHERE email=$1 AND pass=$2',
                [email, pass]
            );

            const restid = rows.rows[0].id;

            const string_categ = categ.toString();
            
            const categs = string_categ.split(',');
                
            for(let i = 0; i < categs.length; i++)
                categs[i]=Number(categs[i]);
            console.log(categs);    
                
            for(let i = 0; i < categs.length; i++){
                const insert = await db.query(
                    'INSERT INTO restaurant_categ (restid, idcateg) VALUES ($1, $2)',
                    [restid, categs[i]]
                );
            }
            
            res.send(rows.rows[0]);

        });
    },

    async categs(req, res){
        const {rows} = await db.query(
            'SELECT * FROM categorias',[]
        );

        res.send(rows);
        console.log(rows);
    },


    async index(req, res){

        const {rows} = await db.query(
            'SELECT * FROM restaurants WHERE status=$1', [true]
        );

        res.send(rows);
    
    },


    async searchBycateg(req, res){
        const { id } = req.params;
        const datas = []

        console.log('id back:'+ id);

        const {rows} = await db.query(
            'SELECT * FROM restaurant_categ WHERE idcateg=$1',
            [id]
        );

        for(let i = 0; i < rows.length; i++){
            const obj = await db.query(
                'SELECT * FROM restaurants WHERE id=$1',
                [rows[i].restid]
            );
            console.log(obj);
            if (obj.rows[0].status === true){
                datas.push(obj.rows[0]);
            }
        }
        console.log(datas);
        res.send(datas);
            
    },

    async searchByName(req, res){

        const {name} = req.query;
        
        const {rows} = await db.query(
            'SELECT * FROM restaurants WHERE name LIKE $1',
            [`%${name}%`]
        );

        res.send(rows);

    },

    async getbyId(req, res){

        const { id } = req.params;

        const {rows} = await db.query(
            'SELECT * FROM restaurants WHERE id=$1',
            [id]
        );

        res.send(rows);
    },

    async delivery(req, res){

        const {type} = req.query;

        const {rows} = await db.query(
            'SELECT * FROM restaurants WHERE entrega=$1 AND status=$2',
            [type, true]
        );

        res.send(rows);

    },

    async popular(req, res){

        const populars = [];

        try{
            const rests = await db.query(
                'SELECT * FROM restaurants WHERE status=$1',
                [true]
            );

            for(let i = 0; i < rests.rows.length; i++){

                const foods = await db.query(
                    'SELECT * FROM foods_restaurant WHERE restid=$1',
                    [rests.rows[i].id]
                );

                let qnt = 0;

                for(let j = 0; j < foods.rows.length; j++){

                    const promo = await db.query(
                        'SELECT * FROM desconto WHERE food=$1 AND validade=$2',
                        [foods.rows[j].id, true]
                    );	

                    if(promo.rows.length !== 0){
                        if( ((1 - promo.rows[0].percent)*foods.rows[j].price) > 10)		
                            qnt++;
                    }else
                        if(foods.rows[j].price > 10)
                            qnt++;  
                }

                if(foods.rows.length === 0)
                    qnt=-1;
                    
                if(!qnt)
                    populars.push(rests.rows[i]);
                
            }

            res.send(populars);
        }catch(e){
            res.send({err:e});
        }

    },

    async maisPedidos(req, res){

        let maisPedidos = [];

        const now = new Date();
        const yest = new Date(now - 86400000);
        
        
        const pedidos = await db.query(
            'SELECT * FROM pedido',
            []
        );
        
        for(let i = 0; i < pedidos.rows.length; i++){

            pedidos.rows[i].idfoods = JSON.parse(pedidos.rows[i].idfoods);

            for(let j = 0; j < pedidos.rows[i].idfoods.length; j = j + 2){

                let k = 0;
                while(k < maisPedidos.length){
                    
                    if(pedidos.rows[i].idfoods[j] === maisPedidos[k][0]){
                        maisPedidos[k][1] += pedidos.rows[i].idfoods[j+1];
                        break;
                    }
                    k++;

                }

                if(k === maisPedidos.length)
                    maisPedidos.push([pedidos.rows[i].idfoods[j], pedidos.rows[i].idfoods[j+1]]);

            }

        }

        maisPedidos = maisPedidos.sort((a, b)=>{
            return b[1] - a[1]
        });

        console.log(maisPedidos);
        
        const foods = await db.query(
            'SELECT * FROM foods_restaurant WHERE id=$1 OR id=$2 OR id=$3 OR id=$4 OR id=$5',
            [maisPedidos[0][0], maisPedidos[1][0], maisPedidos[2][0], maisPedidos[3][0], maisPedidos[4][0]]
        );

        console.log(foods.rows)
        
        const rests = await db.query(
            'SELECT * FROM restaurants WHERE id=$1 OR id=$2 OR id=$3 OR id=$4 OR id=$5',
            [foods.rows[0].restid, foods.rows[1].restid, foods.rows[2].restid, foods.rows[3].restid, foods.rows[4].restid]
        );
        console.log(rests.rows)
        res.send(rests.rows);

    },

    async rel1(req, res){

        const { id } = req.query; 

        let maisPedidos = [];

        const pedidos = await db.query(
            'SELECT * FROM pedido WHERE restid=$1',
            [id]
        );

        for(let i = 0; i < pedidos.rows.length; i++){

            pedidos.rows[i].idfoods = JSON.parse(pedidos.rows[i].idfoods);

            for(let j = 0; j < pedidos.rows[i].idfoods.length; j = j + 2){

                let k = 0;
                while(k < maisPedidos.length){
                    
                    if(pedidos.rows[i].idfoods[j] === maisPedidos[k][0]){
                        maisPedidos[k][1] += pedidos.rows[i].idfoods[j+1];
                        break;
                    }
                    k++;

                }

                if(k === maisPedidos.length)
                    maisPedidos.push([pedidos.rows[i].idfoods[j], pedidos.rows[i].idfoods[j+1]]);

            }

        }

        maisPedidos = maisPedidos.sort((a, b)=>{
            return b[1] - a[1]
        });

        const food = await db.query(
            'SELECT * FROM foods_restaurant WHERE id=$1',
            [maisPedidos[0][0]]
        );

        res.send({food: food.rows, qnt: maisPedidos[0][1], image: food.rows.image});

    },

    async rel2(req, res){

        const now = new Date();
        const {period, id} = req.query;

        console.log(period, id);

        const limit = new Date(now - 86400000*period);
        const {rows} = await db.query(
            'SELECT * FROM pedido WHERE data_pedido < $1 AND data_pedido >= $2 AND restid=$3',
            [now, limit, id]
        );

        let rel2 = rows.sort((a, b)=>{
            return b.data_pedido - a.data_pedido;
        });
        
        const frete = await db.query(
            'SELECT entrega FROM restaurants WHERE id=$1',
            [id]
        );

        rel2 = rows.map((item)=>{
            
            let entrega = 0;
            if(frete.rows[0].entrega)
                entrega = 2;
        
            return {value: item.value - entrega, frete: entrega, date: item.data_pedido}
        });
        
        res.send(rel2);

    },

    async rel3(req, res){

        const {id} = req.query;

        const medias = [];

        let now = new Date();
        const [hour, minute, second] = now.toString().split(' ')[4].split(':');
        now = new Date(now - (hour*60*60*1000 + minute*60*1000 + second * 1000));
        
        let yest = new Date(now - 86400000);
        let limit = new Date(yest - 7*86400000);

        try{
            const rests = await db.query(
                'SELECT * FROM restaurants WHERE id=$1',
                [id]
            );

            const foods = await db.query(
                'SELECT * FROM foods_restaurant WHERE restid=$1',
                [rests.rows[0].id]
            );

            for(let j = 0; j < foods.rows.length; j++){

                const promo = await db.query(
                    'SELECT * FROM desconto WHERE food=$1',
                    [foods.rows[j].id]
                );	
                    
                //teve promo alguma vez
                if(promo.rows.length !== 0){

                    const interval = promo.rows.filter(item => {
                        return item.data < now && item.data >= limit;
                    });
                        
                    //nao teve promo essa semana
                    if(interval.length === 0){

                        const actual = promo.rows.find(item =>{
                            return item.data > limit
                        })

                        //teve promo hj
                        if(actual){

                            const med = promo.rows.find(item => {
                                return item.data < limit
                            });

                            let medPrice;

                            if(!med){
                                medPrice = foods.rows[j].price;
                            }else{
                                medPrice = (1-med.percent)*foods.rows[j].price;
                            }
                            
                            medias.push({name: foods.rows[j].name, medPrice: medPrice, image: foods.rows[j].image});

                        }else{

                            const med = promo.rows.find(item => {
                                return item.data < limit
                            });
                            const price = (1 - med.percent/100)*foods.rows[j].price;
                            medias.push({name: foods.rows[j].name, medPrice: price, image: foods.rows[j].image});

                        }
                            
                    }else{
                            
                        let sum = 0;
                        let days = 0;
                        for(let k = 0; k < interval.length; k++){

                            if(k === 0 || k === interval.length-1){

                                if(k === 0){

                                    if(interval[k].data.toString() !== limit.toString()){

                                        const firstDescont = promo.rows.find(item=>{
                                            return item.data < limit
                                        });
                                            
                                        if(!firstDescont){
                                            days = Math.floor((interval[k].data - limit)/86400000);
                                            sum = sum + days*foods.rows[j].price;
                                        }else{
                                            days = Math.floor((interval[k].data - limit)/86400000);
                                            sum = sum + days*(1 - firstDescont.percent/100)*foods.rows[j].price;
                                        }

                                    }else{

                                        if(interval.rows.length === 1){
                                            sum = sum + 7*(1 - interval[k].percent/100)*foods.rows[j].price;
                                        }else{
                                            days = Math.floor((interval[k+1].data - interval[k].data)/86400000);
                                            sum = sum + days*(1 - interval[k].percent/100)*foods.rows[j].price;
                                        }

                                    }
                                }    

                                if(k === interval.length - 1){

                                    if(interval[k].data.toString() !== now.toString()){
                                        days = Math.floor((now - interval[k].data)/86400000); 
                                        sum = sum + days*(1 - interval[k].percent/100)*foods.rows[j].price;
                                    }

                                }
                                

                            }else{

                                days = Math.floor((interval[k+1].data - interval[k].data)/86400000);
                                sum = sum + days*(1 - interval[k].percent/100)*foods.rows[j].price;

                            }
                        }
                            
                        const med = sum/7;
                        medias.push({name: foods.rows[j].name, medPrice: med, image: foods.rows[j].image});
                    }

                }else{
                    medias.push({name: foods.rows[j].name, medPrice: foods.rows[j].price, image: foods.rows[j].image});
                }
                    
            }
                    
            res.send(medias);
        }catch(err){
            console.log(err)
            res.send({err:err});
        }

    },

    async promotion(req, res){

        const promotions = [];

        let now = new Date();
        const [hour, minute, second] = now.toString().split(' ')[4].split(':');
        now = new Date(now - (hour*60*60*1000 + minute*60*1000 + second * 1000));
        
        let yest = new Date(now - 86400000);
        let limit = new Date(yest - 7*86400000);

        try{
            const rests = await db.query(
                'SELECT * FROM restaurants WHERE status=$1',
                [true]
            );

            for(let i = 0; i < rests.rows.length; i++){

                const foods = await db.query(
                    'SELECT * FROM foods_restaurant WHERE restid=$1',
                    [rests.rows[i].id]
                );

                let qnt = 0;

                for(let j = 0; j < foods.rows.length; j++){

                    const promo = await db.query(
                        'SELECT * FROM desconto WHERE food=$1',
                        [foods.rows[j].id]
                    );	
                    
                    //teve promo alguma vez
                    if(promo.rows.length !== 0){

                        const interval = promo.rows.filter(item => {
                            return item.data < now && item.data >= limit;
                        });
                        
                        //nao teve promo essa semana
                        if(interval.length === 0){

                            const actual = promo.rows.find(item =>{
                                return item.data > limit
                            })

                            //teve promo hj
                            if(actual){

                                const med = promo.rows.find(item => {
                                    return item.data < limit
                                });

                                let percent;

                                if(!med){
                                    percent = (1 - actual.percent)*foods.rows[j].price/foods.rows[j].price;
                                }else{
                                    percent = (1 - actual.percent)*foods.rows[j].price/((1-med.percent)*foods.rows[j].price);
                                }

                                if(percent <= 0.5)
                                    qnt++;

                            }
                            
                        }else{
                            
                            let sum = 0;
                            let days = 0;
                            for(let k = 0; k < interval.length; k++){

                                if(k === 0 || k === interval.length-1){

                                    if(k === 0){

                                        if(interval[k].data.toString() !== limit.toString()){

                                            const firstDescont = promo.rows.find(item=>{
                                                return item.data < limit
                                            });
                                            
                                            if(!firstDescont){
                                                days = Math.floor((interval[k].data - limit)/86400000);
                                                sum = sum + days*foods.rows[j].price;
                                            }else{
                                                days = Math.floor((interval[k].data - limit)/86400000);
                                                sum = sum + days*(1 - firstDescont.percent/100)*foods.rows[j].price;
                                            }

                                        }else{

                                            if(interval.rows.length === 1){
                                                sum = sum + 7*(1 - interval[k].percent/100)*foods.rows[j].price;
                                            }else{
                                                days = Math.floor((interval[k+1].data - interval[k].data)/86400000);
                                                sum = sum + days*(1 - interval[k].percent/100)*foods.rows[j].price;
                                            }

                                        }
                                    }

                                    if(k === interval.length - 1){

                                        if(interval[k].data.toString() !== now.toString()){
                                            days = Math.floor((now - interval[k].data)/86400000); 
                                            sum = sum + days*(1 - interval[k].percent/100)*foods.rows[j].price;
                                        }

                                    }

                                }else{

                                    days = Math.floor((interval[k+1].data - interval[k].data)/86400000);
                                    sum = sum + days*(1 - interval[k].percent/100)*foods.rows[j].price;

                                }

                            }
                            
                            const actualPrice = promo.rows.find(item=>{
                                return item.validade === true;
                            });
                            
                            const med = sum/7;
                            const percent = (1 - actualPrice.percent/100)*foods.rows[j].price/med;

                            if(percent >= 0.5)
                                qnt++;

                        }

                    }
                    
                }
                    
                if(qnt>0)
                    promotions.push(rests.rows[i]);
                
            }

            res.send(promotions);
        }catch(err){
            console.log(err)
            res.send({err:err});
        }

    },

    async teste(req, res){
        let now = new Date();
        const [hour, minute, second] = now.toString().split(' ')[4].split(':');
        now = new Date(now - (hour*60*60*1000 + minute*60*1000 + second * 1000));
        
        const promo = await db.query(
            'SELECT * FROM desconto where id=$1',
            [5]
        );
        
        console.log(promo.rows[0].data.toString());
        console.log(now.toString())

        res.send({equal: Math.floor((now - promo.rows[0].data)/86400000)});
    },

    async status(req, res){

        const { state, id } = req.query;

        const { rows } = await db.query(
            'UPDATE restaurants SET status=$1 WHERE id=$2', [state, id]
        );

        res.send(rows);
    },

    async frete(req, res) {

        const { frete, id } = req.query;

        const { rows } = await db.query(
            'UPDATE restaurants SET entrega=$1 WHERE id=$2', [frete, id]
        )
    }

}