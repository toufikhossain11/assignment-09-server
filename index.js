const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
dotenv.config()
const app = express()
const uri = process.env.MONGODB_URI;
const port = process.env.PORT || 5000
app.use(cors())
app.use(express.json())

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs')

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
// midleware
const verifyJWT = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  const token = authorization.split(' ')[1];
  if (!token) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  
  try {
    const {payload} = await jwtVerify(token, JWKS);
    console.log('payload:', payload);
    next();
  } catch (error) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
};

const JWKS = createRemoteJWKSet(new URL('http://localhost:3000/api/auth/jwks'));


async function run() {
  try {
    await client.connect();
    const db=client.db('docappoint').collection('datas');
    const bookingCollection=client.db('docappoint').collection('bookings');

     app.get('/datas', async (req, res) => {
      const result = await db.find().sort({ rating: -1 }).limit(3).toArray();
      res.send(result)
     }),
     app.get('/allAppointments', async (req, res) => {
      const result = await db.find().toArray();
      res.send(result)
     });
     app.get('/allAppointments/:id', verifyJWT, async (req, res) => {
      
      const {id} = req.params
      const result = await db.findOne({ _id: new ObjectId(id) });
      res.json(result)
     });
     app.get('/bookings', async (req, res) => {
      const result = await bookingCollection.find().toArray();
      res.json(result)
     });
     app.post('/bookings', async (req, res) => {
      const booking = req.body;
      console.log(booking)
      const result = await bookingCollection.insertOne(booking);
      res.json(result)
     });
      app.put('/bookings/:id', async (req, res) => {
      const { id } = req.params;
      const { patientName, date, time, reason } = req.body;
      const result = await bookingCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: { patientName, date, time, reason }
        }
      );
      res.json(result)
    });
     app.delete('/bookings/:bookingId', async (req, res) => {
      const {bookingId} = req.params;
      const result = await bookingCollection.deleteOne({ _id: new ObjectId(bookingId) });
      res.json(result)
     });

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
res.send('Hello World!') })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})