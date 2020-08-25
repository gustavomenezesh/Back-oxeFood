const db = require('../db/db_connection');
const gdrive = require('../../utils/gdrive');

module.exports = {

    async create(req, res, next){

        console.log(req);
        const {name, email, adress, pass, tipo} = req.body;
        const productImage = req.file;

        console.log(productImage);

        gdrive.imageUpload(`${name}.png`, "./uploads/image.jpg", async (link) => {
            console.log(link);
            const {rows} = await db.query(
                'INSERT INTO clients (name, email, adress, pass, tipo, image) VALUES ($1, $2, $3, $4, $5, $6)',
                [name, email, adress, pass, tipo, link]
            );

            const client = await db.query(
                'SELECT * FROM clients WHERE email=$1 AND pass=$2',
                [email, pass]
            );

            const adrss = await db.query(
                'INSERT INTO enderecos (title, adress, client) VALUES ($1, $2, $3)',
                ['Casa', adress, client.rows[0].id]
            );

            res.send({
                message: "Client added successfully!",
                body: {
                    client: {name, email, adress, pass, tipo, link}
                }
            });
        });
        

    },

    async update(req, res){

        const {id, name, email, adress, newpass} = req.body;
        const pass = newpass;
        console.log(req.body);

        if ( adress !== '' ) {
            let { rows } = await db.query(
                'UPDATE clients SET adress = $2 WHERE id = $1',
                [id, adress]
            );
        }
        if ( name !== '' ){
            rows = await db.query(
                'UPDATE clients SET name = $2 WHERE id = $1',
                [id, name]
            );
        }
        if ( pass !== '' ){
            rows = await db.query(
                'UPDATE clients SET pass = $2 WHERE id = $1',
                [id, pass]
            );
        }
        if ( email !== '' ){
            rows = await db.query(
                'UPDATE clients SET email = $2 WHERE id = $1',
                [id, email]
            );
        }


        res.send({
            message: "Adress updated successfully!",
            body: {
                client: {name, email, adress, pass}
            }
        });
    },

    async findUser(req, res) {

        const { id } = req.params;

        const {rows} = await db.query(
            'SELECT * FROM clients WHERE id=$1',
            [id]
        );

        res.send(rows);

    },

    async login(req, res){
        
        const {email, pass} = req.body;
        console.log({email, pass});
        
        let rows = await db.query(
            'SELECT * FROM clients WHERE email=$1 AND pass=$2',
            [email, pass]
        );
        
        if(!rows.rows.length){
            rows = await db.query(
                'SELECT * FROM restaurants WHERE email=$1 AND pass=$2',
                [email, pass]
            );
        }

        res.send(rows.rows);
        console.log(rows.rows)
       
    },

    async addAdress(req, res){

        const {title, adress, client, position} = req.body;
        try{
            const adrss = await db.query(
                'INSERT INTO enderecos (title, adress, client, position) VALUES ($1, $2, $3, $4)',
                [title, adress, client, position]
            );
            res.send({msg: 'Endereço Cadastrado'});
        }catch(e){
            res.send({err: e});
        }

    },

    async listAdress(req, res){

        const {id} = req.query;

        try{
            const {rows} = await db.query(
                'SELECT * FROM enderecos WHERE client=$1',
                [id]
            );
            res.send(rows);
        }catch(e){
            res.send({err: e});
        }

    },

    async do_order(req, res){

        const {idclient, idfoods, value, adress, restid, frete} = req.body;
        
        console.log(idfoods.toString());

        const date = new Date();

        try{
            let {rows} = await db.query(
                'INSERT INTO pedido (idfoods, value, client, data_pedido, restid, adress, frete) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                ['['+idfoods.toString()+']', value, idclient, date, restid, adress, frete]
            );
        }catch(e){
            console.log(e.detail);
        }

        res.send({idfoods, value, idclient, date});

    },

    async filterOrders(req, res){

        const {id} = req.query;

        const { rows } = await db.query(
            'SELECT * FROM pedido WHERE client=$1',
            [id]
        );

        let sortedOrders = rows.sort((a, b)=>{
            return b.data_pedido - a.data_pedido
        });


        for(let i = 0; i < sortedOrders.length; i++){

            const foods=[];
            sortedOrders[i].idfoods = JSON.parse(sortedOrders[i].idfoods); 

            for(let j = 0; j < sortedOrders[i].idfoods.length; j=j+2){

                const food = await db.query(
                    'SELECT * FROM foods_restaurant WHERE id=$1',
                    [sortedOrders[i].idfoods[j]]
                );
                console.log(food.rows[0].name);
                foods.push({name: food.rows[0].name, qnt: sortedOrders[i].idfoods[j+1]});

            }

            sortedOrders[i].idfoods = foods;
        }

        console.log(sortedOrders);

        res.send(sortedOrders);

    }

    
}