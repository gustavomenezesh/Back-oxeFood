const db = require('../db/db_connection');
const { response } = require('express');
const gdrive = require('../../utils/gdrive');
const base64ToImage = require('base64-to-image');

module.exports = {

    async index(req, res){

        let valActual;

        const { rows } = await db.query('SELECT * FROM car', []);
        console.log(rows)
        const send = [];
        for(let i = 0; i < rows.length; i++){
            
            const food = await db.query('SELECT * FROM foods_restaurant where id=$1', [rows[i].food]);
            const foodDesc = await db.query('SELECT * FROM desconto where food=$1 and validade=$2', [rows[i].food, true]);
            console.log(food.rows[i]);
            console.log(foodDesc === undefined ? true : foodDesc);
            
            if(foodDesc.rowCount ){
                valActual = (1 - foodDesc.rows[i].percent/100) * food.rows[i].price;
            }else{
                valActual = food.rows[i].price;
            }

            const resp = {food: rows[i].food, qnt: rows[i].qnt, client: rows[i].client, actuaPrice: valActual}

            send.push(resp);
        }


        res.send(send);


    },

    async add(req, res){

        const { food, qnt, client } = req.body;

        const insert = await db.query(
            'INSERT INTO car (food, qnt, client) VALUES ($1, $2, $3)',
            [food, qnt, client]
        );


    },

    async remove(req, res){

        const { id } = req.body;

        const del = await db.query(
            'DELETE FROM car WHERE id=$1', [id]
        );
    },

    /* async finish(req, res){

    } */

}