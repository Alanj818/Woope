import express from 'express';
import { getPurpleAirPins, createPurpleAirPin, updatePurpleAirPin,deletePurpleAirPin} from '../models/purpleairPins';

//add only admin creation protecttion later 
import { authenticateToken, requirePermission } from '../middleware/authMiddleware';

const router = express.Router();

//GET
router.get('/pins', async (req, res) => {
    try{
        const pins = await getPurpleAirPins();
        res.status(200).json(pins);

    } catch(err){
        console.log(err);
        res.status(500).json({ error: 'Failed to fetch PurpleAir pins' });
    }
})

//create
router.post('/pins', async (req, res) => {
  const { name, purpleAirSensorId } = req.body;

  if (!name || !purpleAirSensorId) {
    return res.status(400).json({
      error: 'name and purpleAirSensorId are required',
    });
  }

  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid name' });
  }

  if (!/^\d+$/.test(purpleAirSensorId)) {
    return res.status(400).json({
      error: 'purpleAirSensorId must be a numeric string',
    });
  }

  try {
    const pin = await createPurpleAirPin(
      name.trim(),
      purpleAirSensorId
    );
    res.status(201).json(pin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create PurpleAir pin' });
  }
});

//edit
router.put('/pins/:id', async (req, res) => {
  const { id } = req.params;
  const { name, purpleAirSensorId } = req.body;

  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ error: 'Invalid pin ID' });
  }

  if (!name || !purpleAirSensorId) {
    return res.status(400).json({
      error: 'name and purpleAirSensorId are required',
    });
  }

  if (!/^\d+$/.test(purpleAirSensorId)) {
    return res.status(400).json({
      error: 'purpleAirSensorId must be a numeric string',
    });
  }

  try {
    const pin = await updatePurpleAirPin(
      Number(id),
      name.trim(),
      purpleAirSensorId
    );
    res.json(pin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update PurpleAir pin' });
  }
});

//delete
router.delete('/pins/:id', async (req, res) => {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ error: 'Invalid pin ID' });
  }

  try {
    await deletePurpleAirPin(Number(id));
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete PurpleAir pin' });
  }
});




export default router;

