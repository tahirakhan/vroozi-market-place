# vroozi-market-place

This is the BE function for the vroozi-market-place application, will be deployed on firebase

1. When user talk to google assistant, google assistant will call a perticular intent on dialoguflow.

2. Dialogflow will invoke a webhook on google cloud firebase function.

3. Function deployed on firebase will call the vroozi api/gateway or for the demo we have make a custom api to provide the required services to the google assistant.

4. Custom api is currently connecting to the mongodb directly and later we can replace it with the vroozi api.
