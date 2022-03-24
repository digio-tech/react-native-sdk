# Digio React Native SDK

SDK for invoking client side journey for any of Digio request

How to Use?

What you need to know?

```       
  1. Document Id/Request Id
  2. User Identifier i.e. Email or mobile
  3. Login Token for given request 
  4. Other settings in options: environment to use, (optional) logo, (optional)theme 
  5. Implement success and failure callbacks
```

Sample: 

    import { DigioRNComponent } from 'react-native-digio-sdk';
    export default class MyComponent extends Component{
    constructor(props){  
        super(props);
        this.state = {
          digioDocumentId: 'Pass request_id for kyc/enach/esign here',
          digioUserIdentifier: 'Pass email/mobile as passed in request here',
          digioLoginToken: 'Pass GWT token Id here',
          options: {
              "environment": "sandbox/production",
              "logo":  "yourlogourl",
              "theme" : {
                "primaryColor" : < 6 char color hex code only e.g. #234FDA, used for background>,
                "secondaryColor" : < 6 char color hex code only e.g. #234FDA, used for font color>
                }
              }
          }
      }


      onSuccess = (t) =>{
        console.log(t+ " Response from Digio SDk ");
      }

      onCancel = () =>{
        console.log("Cancel Response from Digio SDk ");
      }


      componentDidMount = () =>{}


      render(){
      **             return (
                      <DigioRNComponent onSuccess={this.onSuccess} onCancel={this.onCancel} options={this.state.options} digioDocumentId={this.state.digioDocumentId} identifier={this.state.digioUserIdentifier} digioToken={this.state.digioLoginToken} />
                  );**

          }
      };
