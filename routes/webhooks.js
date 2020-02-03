import express from 'express';
// import fbReceive from '../helpers/receive';

const router = express.Router();
router.get('/', (req, res) => {
    if (req.query['hub.verify_token'] === process.env.WEBHOOK_TOKEN) {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Error, wrong token');
    }
});
export default router;