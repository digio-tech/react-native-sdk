import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

const CONSTANTS = {
    VERSION: '9.0',
    ENVIRONMENTS: {
        STAGE: "stage",
        SANDBOX: "sandbox",
        PRODUCTION: "production"
    },
    SIGN_METHODS: {
        OTP: "otp",
        BIOMETRIC: "biometric"
    },
    URLS: {
        //STAGE : "http://localhost:8082",
        STAGE: "https://ext.digio.in",
        SANDBOX: "https://ext.digio.in",
        // SANDBOX: "http://192.168.0.106:8082",
        PRODUCTION: "https://app.digio.in",
        API_MANDATE_SUFFIX: "/#/enach-mandate-direct",
        ESIGN_SUFFIX: "/#/gateway/login"
    },
    EXCEPTIONS: {
        MISSING_CONSTRUCTOR_CONFIG: {
            message: "Digio constructor requires configuration options for initialization."
        },
        INVALID_ENVIRONMENT: {
            message: "Provided environment value is invalid."
        },
        INVALID_METHOD: {
            message: "Provided signing method value is invalid."
        },
        INVALID_DOCUMENT_ID: {
            message: "Provided document id is invalid."
        },
        INVALID_IDENTIFIER: {
            message: "Provided email id or mobile number is invalid."
        },
        INVALID_REDIRECT_URL: {
            message: "Provided redirect url string is invalid."
        },
        INVALID_ERROR_URL: {
            message: "Provided error url string is invalid."
        },
        INVALID_LOGO_URL: {
            message: "Provided logo url is invalid."
        },
        INVALID_CALLBACK_METHOD: {
            message: "Provided callback method is not a function or is invalid."
        },
        INVALID_IFRAME_INVOCATION: {
            message: "Provided iframe invocation value is invalid or not a boolean."
        },
        INVALID_AUTH_TYPE: {
            message: "Provided auth type is invalid."
        }
    },
    THEME: {
        PRIMARY_COLOR: "#2979BF",
        SECONDARY_COLOR: "#FFFFFF"
    },
    CLOSE_BTN_BASE64: "iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAA60lEQVR42tXUPQqEMBAFYO+kYGFhYeFaWAm2qYyFlxBsraxELCzF1ip4Br2CR5klCyuLyeRni4UNTPf4ILxhHOfv3jzPMAwD6HJd1wFjTJ2r6xpc131NWZZoOMuyKzeOozzXtu0VUqGf2HuWZRHRKIqE4B2VYXwIISI4TZM0zIdSChjmeR5s2yb/dt/3KIph67qqizFFjTBT1ArTlcQnz3M7DCtAt1JfY8aoDaZFi6JQFqAqqmkaEU3TVNsmhlZVJYLHcUAQBNrVuKNxHMN5nvJv7/sOYRiC7/vKPePnjWNJkuCY7QOAx08O9BNR9VtE5qAr5wAAAABJRU5ErkJggg=="
};

const DigioException = function (err) {
    this.message = err.message;
    this.name = "DigioException";
};

DigioException.prototype.toString = function () {
    return this.name + ': "' + this.message + '"';
};

const digioService = {
    validateIdentifier: function (identifier) {
        if (!identifier) {
            throw new DigioException(CONSTANTS.EXCEPTIONS.INVALID_IDENTIFIER);
        }
    },
    validateDocumentId: function (docId) {
        if (!docId) {
            throw new DigioException(CONSTANTS.EXCEPTIONS.INVALID_DOCUMENT_ID + " : Id Missing");
        }
        if (Array.isArray(docId)) {
            if (docId.length === 0) {
                throw new DigioException(CONSTANTS.EXCEPTIONS.INVALID_DOCUMENT_ID + " : Array Is Empty");
            }
            else {
                for (var i = 0; i < docId.length; i++) {
                    if (!docId[i]) {
                        throw new DigioException(CONSTANTS.EXCEPTIONS.INVALID_DOCUMENT_ID + " : At Array Index = " + i);
                    }
                }
            }
        }
    },

    generateUrl: function (base_url, base_suffix, doc_id, txn_id, identifier, token_id, extendedConfig) {
        var url = base_url + base_suffix;
        url += "/" + doc_id;
        url += "/" + txn_id;
        url += "/" + identifier;

        var params = [];
        var dlmtr = "&";

        if (token_id) {
            params.push("token_id=" + token_id);
        }
        if (extendedConfig.ver) {
            params.push("sdkver=" + extendedConfig.ver);
        }
        if (extendedConfig.logo) {
            params.push("logo=" + encodeURIComponent(extendedConfig.logo));
        }
        if (extendedConfig.redirectUrl) {
            params.push("redirect_url=" + encodeURIComponent(extendedConfig.redirectUrl));
        }
        if (extendedConfig.errorUrl) {
            params.push("error_url=" + encodeURIComponent(extendedConfig.errorUrl));
        }
        if (extendedConfig.method) {
            params.push("method=" + encodeURIComponent(extendedConfig.method));
        }
        if (extendedConfig.isIframe) {
            params.push("is_iframe=" + encodeURIComponent(extendedConfig.isIframe));
        }
        if (extendedConfig.docs) {
            params.push("docs=" + encodeURIComponent(extendedConfig.docs));
        }
        if (extendedConfig.theme) {
            params.push("theme=" + encodeURIComponent(JSON.stringify(extendedConfig.theme)));
        }

        if (extendedConfig.otherParams) {
            for (var param in extendedConfig.otherParams) {
                params.push(param + "=" + extendedConfig.otherParams[param]);
            }
        }

        if (params.length) {
            url += "?" + params.join(dlmtr);
        }

        return url;
    }
};

class DigioRNComponent extends Component {
    constructor(props) {
        super(props);
        
        this.state = { 
            showWebView: false
        }
        this.webview = null;
        this.digioUrl = null;
        this.version= CONSTANTS.VERSION;
        this.environment= CONSTANTS.ENVIRONMENTS.STAGE;
        this.method= CONSTANTS.SIGN_METHODS.OTP;
        this.URL= {};
        this.logo= null;
        this.redirectUrl= null;
        this.errorUrl= null;
        this.isIframe= false;
        this.documentId= null;
        this.txnId= null;
        this.popup= null;
        this.lastState= null;
        this.resultCaptured= false;
        this.result= null;
        this.iFrameId= null;
        this.iFrameObj= null;
        this.theme= {};
        this.loading=null;
        this.reset();
    }

    inflate(t) {
        if (!t) {
            throw new DigioException(CONSTANTS.EXCEPTIONS.MISSING_CONSTRUCTOR_CONFIG);
        }
        if (this.props.onSuccess) {
            if (typeof this.props.onSuccess !== "function") {
                throw new DigioException(CONSTANTS.EXCEPTIONS.INVALID_CALLBACK_METHOD);
            }
        }
        if (t.environment) {
            if (t.environment.toLowerCase() === CONSTANTS.ENVIRONMENTS.STAGE.toLowerCase() ||
                t.environment.toLowerCase() === CONSTANTS.ENVIRONMENTS.SANDBOX.toLowerCase() ||
                t.environment.toLowerCase() === CONSTANTS.ENVIRONMENTS.PRODUCTION.toLowerCase()) {
                this.environment = t.environment;
            }
            else {
                throw new DigioException(CONSTANTS.EXCEPTIONS.INVALID_ENVIRONMENT);
            }
        }
        if (t.logo) {
            if (typeof t.logo !== "string") {
                throw new DigioException(CONSTANTS.EXCEPTIONS.INVALID_LOGO_URL);
            }
            this.logo = t.logo;
        }
        if (t.method) {
            if (t.method === CONSTANTS.SIGN_METHODS.OTP || t.method === CONSTANTS.SIGN_METHODS.BIOMETRIC) {
                this.method = t.method;
            }
            else {
                throw new DigioException(CONSTANTS.EXCEPTIONS.INVALID_METHOD);
            }
        }
        if (t.redirect_url) {
            if (typeof t.redirect_url !== "string") {
                throw new DigioException(CONSTANTS.EXCEPTIONS.INVALID_REDIRECT_URL);
            }
            this.redirectUrl = t.redirect_url;
        }
        if (t.error_url) {
            if (typeof t.error_url !== "string") {
                throw new DigioException(CONSTANTS.EXCEPTIONS.INVALID_ERROR_URL);
            }
            this.errorUrl = t.error_url;
        }
        if (t.theme) {
            this.theme = {};
            if (t.theme.primaryColor) {
                this.theme.PRIMARY_COLOR = t.theme.primaryColor;
            }
            else {
                this.theme.PRIMARY_COLOR = CONSTANTS.THEME.PRIMARY_COLOR;
            }
            if (t.theme.secondaryColor) {
                this.theme.SECONDARY_COLOR = t.theme.secondaryColor;
            }
            else {
                this.theme.SECONDARY_COLOR = CONSTANTS.THEME.SECONDARY_COLOR;
            }
        }
        else {
            this.theme = CONSTANTS.THEME;
        }
        for (var env in CONSTANTS.ENVIRONMENTS) {
            this.URL[CONSTANTS.ENVIRONMENTS[env]] = CONSTANTS.URLS[env];
        }
        this.otherParams = {};
        for (var param in t) {
            if (!this.otherParams[param] && param.startsWith("dg_")) {
                this.otherParams[param.substring(3, param.length)] = t[param];
            }
        }
        this.submit(this.props.digioDocumentId, this.props.identifier, this.props.digioToken);
    }

    getLoadingHtml() {
        var theme = this.theme;
        var style = "<style>@-webkit-keyframes placeHolderShimmer{0%{background-position: -1000px 0}100%{background-position: 1000px 0}}@keyframes placeHolderShimmer{0%{background-position: -1000px 0}100%{background-position: 1000px 0}}.animated-background{z-index: 999;-webkit-animation-duration: 20s; animation-duration: 20s; -webkit-animation-fill-mode: forwards; animation-fill-mode: forwards; -webkit-animation-iteration-count: infinite; animation-iteration-count: infinite; -webkit-animation-name: placeHolderShimmer; animation-name: placeHolderShimmer; -webkit-animation-timing-function: linear; animation-timing-function: linear; background: transparent; background: -webkit-gradient(linear, left top, right top, color-stop(28%, transparent), color-stop(68%, " + theme.SECONDARY_COLOR + "14), color-stop(92%, transparent)); background: -webkit-linear-gradient(left, transparent 28%, #" + theme.SECONDARY_COLOR + "14 68%, transparent 92%); background: linear-gradient(to right, transparent 28%, #" + theme.SECONDARY_COLOR + "14 68%, transparent 92%); -webkit-background-size: 100% 100%; background-size: 100% 100%; height: 100%; width : 100%; top : 0; position: absolute;}</style>";

        var html = style + "<div class='animated-background'></div><div style=\"background: " + theme.PRIMARY_COLOR + ";position: relative; height: 100%; width: 100%;\"><div style=\"position: absolute;width: 100%;height: 20px;top: 20%;text-align: center;color: " + theme.SECONDARY_COLOR + ";font-weight: 300;font-family: Helvetica;\"> Live paperless with Digio </div><div style=\"position: absolute;width: 100%;height: 20px;top: calc(50% - 20px);text-align: center;font-weight: 300;color: " + theme.SECONDARY_COLOR + ";font-family: Helvetica;font-size: 85%;\"> Please wait... </div><div style=\"position: absolute;width: 100%;height: 20px;top: calc(50%);text-align: center;color: " + theme.SECONDARY_COLOR + ";font-weight: 300;font-family: Helvetica;font-size: 85%;\"> Preparing your document </div><div style=\"position: absolute;bottom: 7px;width: 100%;font-family: Helvetica;color: " + theme.SECONDARY_COLOR + ";font-size: 65%; text-align: center; font-weight : 300;\"> Licensed application for <br/> Aadhaar eSign and Digital Signature Certificates </div></div>";
        return html;
    }

    reset() {
        this.result = null;
        this.popup = null;
        this.interval = null;
        this.resultCaptured = false;
        this.lastState = null;
        this.iFrameId = null;
        this.iFrameObj = null;
    }

    getOptionValues (option) {
        option = option.toUpperCase();
        if (CONSTANTS.hasOwnProperty(option)) {
            return Object.values(CONSTANTS[option]);
        }
    }

    componentDidMount = () =>{
        this.inflate(this.props.options)
    }

    render() {
       if (this.state.showWebView) {
           debugger;
            return (
                <View style={{
                    flex: 1
                }}>
                    {this.state.showWebView && this.renderContent()}
                </View>
            );
       }
        return (<View></View>)
    }

    renderContent() {
        return (
            <WebView
                source={{ uri: this.digioUrl }}
                onNavigationStateChange={this._onNavigationStateChange.bind(this)}
                ref={(ref) => (this.webview = ref)}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                mixedContentMode={'compatibility'}
                onLoadStart={this.onWebViewLoadStart.bind(this)}
                originWhitelist={['https://*', 'http://*']}
                onMessage={this.onMessage.bind(this)}
                onLoad={this.onLoad.bind(this)}
                allowFileAccess={true}
                geolocationEnabled={true}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback={true}
                useWebKit={true}
            />
        );
    }

    onLoad() {
    }
    
    onMessage(event) {
        let data = event.nativeEvent.data;
        console.log(data);
        let res = null;
        try {
            res = JSON.parse(data);
        } catch (e) {
            res=data;
        }

        console.log(res);
        if (res && typeof res === 'object' && res.txn_id) {
            
            this.props.onSuccess(res);
            
            this.setState({ showWebView: false });
        } else {
            this.onCancel();
        }
    }

    onWebViewLoadStart() {
        this.webview.injectJavaScript('if(window.opener!==window.ReactNativeWebView){window.opener=window.ReactNativeWebView;}');
        if (!this.loading) {
            this.loading=`document.body.appendChild(${this.getLoadingHtml()})`;
            this.webview.injectJavaScript(this.loading);
        }
    }

    _onNavigationStateChange(webviewState) {
        // console.log(webviewState.url);
    }

    onWebViewError(err) {
        console.log(err.message);
    }

    enachApiSign(id, identifier, token_id) {
        this.documentId = id;
        this.txnId = Math.random().toString(36).slice(2);

        var extendedConfig = {
            ver: this.version,
            logo: this.logo,
            redirectUrl: this.redirectUrl,
            errorUrl: this.errorUrl,
            method: this.method,
            isIframe: this.isIframe,
            theme: this.theme
        };

        if (this.otherParams && Object.keys(this.otherParams).length > 0) {
            extendedConfig.otherParams = this.otherParams;
        }

        var url = CONSTANTS.URLS.API_MANDATE_SUFFIX;
        if (token_id) {
            url = CONSTANTS.URLS.ESIGN_SUFFIX;
        }


        return digioService.generateUrl(this.URL[this.environment], url, this.documentId, this.txnId, identifier, token_id, extendedConfig);
    }
    
    esign (ids, identifier, token_id) {
        digioService.validateDocumentId(ids);
        digioService.validateIdentifier(identifier);
        if (typeof ids === "string" && ids.slice(0, 3) === 'ENA' && ids.slice(ids.length - 2, ids.length) === 'AP') {
            return this.enachApiSign(ids, identifier);
        }

        var primaryId = null;
        if (Array.isArray(ids)) {
            ids.map(function (id) {
                return id.toString();
            });
            primaryId = ids.shift();
        }
        else {
            primaryId = ids.toString();
        }

        if (this.isIframe) {
            var ldr = document.getElementById("dgo-ldr-" + this.iFrameId);
            ldr.parentNode.removeChild(ldr);
        }

        this.documentId = primaryId;
        this.txnId = Math.random().toString(36).slice(2);

        var extendedConfig = {
            ver: this.version,
            logo: this.logo,
            redirectUrl: this.redirectUrl,
            errorUrl: this.errorUrl,
            method: this.method,
            isIframe: this.isIframe,
            theme: this.theme
        };

        if (Array.isArray(ids)) {
            extendedConfig.docs = ids;
        }

        return digioService.generateUrl(this.URL[this.environment], CONSTANTS.URLS.ESIGN_SUFFIX, this.documentId, this.txnId, identifier, token_id, extendedConfig);
    }
    
    cancel() {
        this.setState({showWebView: false});
        const resObj = { "digio_doc_id": this.documentId, "error_code": "CANCELLED", "message": "Signing cancelled" };
        this.props.onCancel(resObj);
    }

    submit (ids, identifier, token_id) {
        try {
            digioService.validateDocumentId(ids);
            digioService.validateIdentifier(identifier);

            if (Array.isArray(ids)) {
                this.digioUrl =  this.esign(ids, identifier, token_id);
            }
            else if (typeof ids === "string" && ids.slice(0, 3) === 'ENA' && ids.slice(ids.length - 2, ids.length) === 'AP') {
                this.digioUrl  = this.enachApiSign(ids, identifier, token_id);
            }
            else {
                this.digioUrl = this.esign(ids, identifier, token_id);
            }
            this.setState({showWebView : !this.state.showWebView});
        }
        catch (err) {
            console.error(err);
        }
    }
}

DigioRNComponent.propTypes = {
    onSuccess: PropTypes.func,
    onCancel: PropTypes.func,
    options: PropTypes.object,
    digioToken: PropTypes.string,
    digioDocumentId: PropTypes.string,
    identifier: PropTypes.string
}

export {DigioRNComponent};