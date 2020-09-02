const express = require('express');
const router = express.Router();
const models = require('../models');
const jwt = require('express-jwt');

const auth = jwt({ secret: process.env.WAFELBAK_API_SECRET, algorithms: ['RS512'] });
/**
 * @swagger
 * tags:
 *   name: Zones
 *   description: Zone management
 */

/** GET zones listing.
 * @swagger
 * /API/zones:
 *    get:
 *      tags: [Zones]
 *      description: |
 *        This should return a list of all zones if you are logged in as an admin. <br> <br>
 *        When you are not logged in as an admin, it should return a 401 error.
 *      responses: 
 *        "200":
 *          description: Array containing all zones.
 *          content: 
 *            application/json: 
 *              schema: 
 *                type: array
 *                items: 
 *                  $ref: '#/components/schemas/Zone'
 *        "401": 
 *          description: Unauthorized access.
 *          content: 
 *            application/json:
 *              schema: 
 *                $ref: '#/components/schemas/Error'
 *        "500": 
 *          description: Server may be down - Internal Server Error.
 *          content: 
 *            application/json:
 *              schema: 
 *                $ref: '#/components/schemas/Error'
 */
router.get("/", auth, function (req, res, next) {
  // Check permissions
  if (req.user.role != "admin") return res.status(401).end();
  models.Zone.findAll({ attributes: ['id', 'zoneName'] })
    .catch(err => {
      return next(err);
    }).then(function (zones) {
      res.json(zones)
    });
});

//TODO authenticatie voor admins/members?
/** GET zone by id
 * @swagger
 * /API/zones/id/{zoneId}:
 *    get:
 *      tags: [Zones]
 *      description: |
 *        This should return a zone by entering it's id if you are logged in as an either role. <br> <br>
 *        When you are not logged in, it should return a 401 error. <br> <br>
 *        When you enter an id of a zone that doesn't exist, it should return a 500 error.
 *      parameters: 
 *        - in: path
 *          name: zoneId
 *          required: true
 *          schema:
 *            type: integer
 *            description: Id of the zone.
 *      responses: 
 *        "200":
 *          description: Zone with the matching id.
 *          content: 
 *            application/json: 
 *              schema: 
 *                $ref: '#/components/schemas/Zone'
 *        "400": 
 *          description: Bad Request, zone doesn't exist.
 *          content: 
 *            application/json:
 *              schema: 
 *                $ref: '#/components/schemas/Error'
 *        "401": 
 *          description: Unauthorized access.
 *          content: 
 *            application/json:
 *              schema: 
 *                $ref: '#/components/schemas/Error'
 *        "500": 
 *          description: Server may be down - Internal Server Error.
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 */
router.param("zoneId", function (req, res, next, id) {
  models.Zone.findOne({ attributes: ['id', 'zoneName'], where: { id: id } })
    .catch(err => {
      return next(err);
    }).then(function (zone) {
      if (!zone) {
        return res.status(400).json("Zone with id: " + id + " not found.");
      } else {
        req.receivedZone = zone;
        return next();
      }
    });
});
router.get("/id/:zoneId", auth, function (req, res, next) {
  res.json(req.receivedZone);
});

//TODO evt get zone by name, allhoewel er niet zoveel zijn dus weet niet of nodig

/** POST Create Zone
 * @swagger
 * /API/zones/create:
 *    post:
 *      tags: [Zones]
 *      description: |
 *        This request is used for creating zones. <br> <br>
 *        When you are not logged in as an admin, it should return a 401 error.
 *      requestBody: 
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required: 
 *                - zoneName
 *              properties:
 *                zoneName:
 *                  type: string
 *                  description: The name of the zone.
 *      responses: 
 *        "200":
 *          description: Zone that has been created.
 *          content: 
 *            application/json: 
 *              schema: 
 *                  $ref: '#/components/schemas/Zone'
 *        "400": 
 *          description: Bad Reqeust, required fielsd are not filled out.
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 *        "401": 
 *          description: Unauthorized access.
 *          content: 
 *            application/json:
 *              schema: 
 *                $ref: '#/components/schemas/Error'
 *        "500": 
 *          description: Server may be down - Internal Server Error.
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 */
router.post("/create", auth, function (req, res, next) {
  if (req.user.role != "admin") return res.status(401).end();

  if (!req.body.zoneName)
    return res.status(400).json("Please fill out all necessary fields.");

  //Creating Zone
  let zone = models.Zone.build({
    zoneName: req.body.zoneName
  });

  zone.save().catch(err => {
    return next(err);
  }).then(() => {
    return res.json(zone);
  })
});

/** PATCH update zone 
 * @swagger
 * /API/zones/updateZone:
 *    patch:
 *      tags: [Zones]
 *      description: |
 *        This request is used for updating a zone. <br> <br>
 *        If the zone doesn't exist, an error 500 will be thrown. <br> <br>
 *        When you are not logged in as an admin, it should return a 401 error.
 *      requestBody: 
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required: 
 *                - id
 *                - zoneName
 *              properties:
 *                id: 
 *                  type: integer
 *                  description: The id of the zone that needs to be updated.
 *                zoneName:
 *                  type: string
 *                  description: The name of the zone that needs to be updated.
 *      responses: 
 *        "200":
 *          description: The updated zone.
 *          content: 
 *            application/json: 
 *              schema: 
 *                 $ref: '#/components/schemas/Zone'
 *        "401": 
 *          description: Unauthorized access.
 *          content: 
 *            application/json:
 *              schema: 
 *                $ref: '#/components/schemas/Error'
 *        "500":
 *          description: Server may be down - Internal Server Error.
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 */
//TODO error incompleter 
router.patch("/updateZone", auth, function (req, res, next) {
  // Check permissions
  if (req.user.role != "admin") return res.status(401).end();

  models.Zone.update({ zoneName: req.body.zoneName }, { where: { id: req.body.id } }).catch(err => {
    return next(err);
  }).then(() => {
    models.Zone.findOne({ attributes: ['id', 'zoneName'], where: { id: req.body.id } }).catch(err => {
      return next(err);
    }).then(function (zone) {
      return res.json(zone)
    });
  });
});

/** DELETE Delete Zone
 * @swagger
 * /API/zones/delete/{zoneId}:
 *    delete:
 *      tags: [Zones]
 *      description: |
 *        <b>BE CAREFUL USING THIS, IT CAN FUCK UP THE WHOLE SYSTEM.</b> <br> <br>
 *        Make sure that no streets are assinged to the zone you want to delete. <br> <br>
 *        This request is used for deleting zones. <br> <br>
 *        Returns true when zone is deleted successfully, false when it failed. <br> <br>
 *        When you are not logged in as an admin, it should return a 401 error.
 *      parameters:
 *        - in: path
 *          name: zoneId
 *          required: true
 *          schema:
 *            type: integer
 *            description: Id of the zone.
 *      responses: 
 *        "200":
 *          description: Boolean.
 *          content: 
 *            application/json: 
 *              schema: 
 *                  type: boolean
 *        "401": 
 *          description: Unauthorized access.
 *          content: 
 *            application/json:
 *              schema: 
 *                $ref: '#/components/schemas/Error'
 *        "500": 
 *          description: Server may be down - Internal Server Error.
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 */
router.param("dZoneId", function (req, res, next, id) {
  models.Zone.destroy({ where: { id: id } })
    .catch(err => {
      return next(err);
    }).then(() => {
      //TODO weergeven van zone die verwijderd werd of skip?
      return next();
    });
});
router.delete("/delete/:dZoneId", auth, function (req, res, next) {
  // Check permissions
  if (req.user.role != "admin") return res.status(401).end();
  res.json(true);
});

module.exports = router;