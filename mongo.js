const { MongoClient } = require('mongodb');



const mongo = {
    db: null,
    
    async connect () {
        try {
            const client = new MongoClient(process.env.MONGO_URL);

            await client.connect();
            console.log('success connecting to mongodb');

            this.db = await client.db(process.env.MONGO_NAME);
            console.log('success choosing the DB');

        } catch (err) {
            console.error(err);
        }
    }
}


module.exports=mongo