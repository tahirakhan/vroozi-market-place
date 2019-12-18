// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
"use strict";
const axios = require("axios");
const functions = require("firebase-functions");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Card, Suggestion } = require("dialogflow-fulfillment");

process.env.DEBUG = "dialogflow:debug"; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(
  (request, response) => {
    const agent = new WebhookClient({ request, response });
    console.log(
      "Dialogflow Request headers: " + JSON.stringify(request.headers)
    );
    console.log("Dialogflow Request body: " + JSON.stringify(request.body));

    function welcome(agent) {
      agent.add(`Welcome to my agent!`);
    }

    function fallback(agent) {
      agent.add(`I didn't understand`);
      agent.add(`I'm sorry, can you try again?`);
    }
    function approvePR(agent) {
      const firstName = agent.parameters.firstName;
      const smartPin = agent.parameters.smartPin;
      const orderNumber = agent.parameters.orderNumber;
      return callServerToApprovePR(firstName, smartPin, orderNumber).then(
        function(response) {
          if (response != "FAILURE") {
            agent.add(response);
          } else {
            close(agent, "Can not approve PR, talk to you next time!");
          }
          //console.log(response);
        }
      );
    }
    function getPurchaseRequestHandler(agent) {
      const firstName = agent.parameters.firstName;
      const smartPin = agent.parameters.smartPin;
      const orderNumber = agent.parameters.orderNumber;
      return callServerToGetPR(firstName, smartPin, orderNumber).then(function(
        response
      ) {
        if (response != "FAILURE") {
          agent.add(response);
        } else {
          close(agent, "Can not find PR, talk to you next time!");
        }
        //console.log(response);
      });
    }
    function svcodeHandler(agent) {
      const firstName = agent.parameters.firstName;
      const smartPin = agent.parameters.smartPin;

      return callServer(firstName, smartPin).then(function(response) {
        if (response != "FAILURE") {
          agent.add(response);
        } else {
          close(agent, "User not valid, talk to you next time!");
        }
        //console.log(response);
      });
    }
    function close(agent, message) {
      agent.add("User not valid, talk to you again.");
    }
    function callServer(firstName, smartPin) {
      return new Promise((resolve, reject) => {
        axios
          .post(
            "https://devqa4-innovation-hub.vroozi.com/user/authenticateUser",
            {
              firstName: firstName,
              smartPin: smartPin,
              methodName: "login"
            }
          )
          .then(function(response) {
            var body = response;
            if (body.data.status == "200") {
              resolve("Welcome to vroozi " + firstName + ", How can i help");
            } else {
              resolve("FAILURE");
            }
          })
          .catch(function(error) {
            resolve("FAILURE");
          });
      });
    }

    function callServerToGetPR(firstName, smartPin, orderNumber) {
      return new Promise((resolve, reject) => {
        axios
          .post("https://devqa4-innovation-hub.vroozi.com/purchase-request", {
            firstName: firstName,
            smartPin: smartPin,
            orderNumber: orderNumber,
            methodName: "getPR"
          })
          .then(function(response) {
            var body = response;
            if (body.data.status == "200") {
              resolve(
                "Purchase request " +
                  body.data.requestName +
                  " submitted by " +
                  body.data.requester +
                  " for " +
                  body.data.total +
                  " is in " +
                  body.data.requestStatus +
                  " status."
              );
            } else {
              resolve("FAILURE");
            }
          })
          .catch(function(error) {
            resolve("FAILURE");
          });
      });
    }
    function callServerToApprovePR(firstName, smartPin, orderNumber) {
      return new Promise((resolve, reject) => {
        axios
          .put("https://devqa4-innovation-hub.vroozi.com/purchase-request", {
            firstName: firstName,
            smartPin: smartPin,
            orderNumber: orderNumber,
            methodName: "getPR"
          })
          .then(function(response) {
            var body = response;
            if (body.data.status == "200") {
              resolve(
                "Purchase request " +
                  body.data.requestName +
                  " has been approved."
              );
            } else {
              resolve("FAILURE");
            }
          })
          .catch(function(error) {
            resolve("FAILURE");
          });
      });
    }
    function placeOrder(firstName, smartPin, item, quantity) {
      return new Promise((resolve, reject) => {
        axios
          .post("https://devqa4-innovation-hub.vroozi.com/rfq", {
            firstName: firstName,
            smartPin: smartPin,
            item: item,
            quantity: quantity,
            methodName: "login"
          })
          .then(function(response) {
            var body = response;
            if (body.status == "200") {
              resolve("Your order has been placed " + firstName);
            } else {
              resolve("FAILURE");
            }
          })
          .catch(function(error) {
            resolve("FAILURE");
          });
      });
    }

    function orderProducts(agent) {
      const item = agent.parameters.item;
      const firstName = agent.parameters.firstName;
      const quantity = agent.parameters.quantity;
      const smartPin = agent.parameters.smartPin;

      return placeOrder(firstName, smartPin, item, quantity).then(function(
        response
      ) {
        if (response != "FAILURE") {
          agent.add(response);
        }
      });
    }
    // Run the proper function handler based on the matched Dialogflow intent name
    let intentMap = new Map();
    intentMap.set("Default Welcome Intent", welcome);
    intentMap.set("Default Fallback Intent", fallback);
    intentMap.set("inputqty", orderProducts);
    intentMap.set("smartPinCode", svcodeHandler);
    intentMap.set("getpr", getPurchaseRequestHandler);
    intentMap.set("approve-pr", approvePR);

    // intentMap.set('your intent name here', yourFunctionHandler);
    // intentMap.set('your intent name here', googleAssistantHandler);
    agent.handleRequest(intentMap);
  }
);
