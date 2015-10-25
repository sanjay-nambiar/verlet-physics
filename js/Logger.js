
var Logger = (function(loggingConsole, Json) {
	'use strict';

	function _constructMessage(type, passed_arguments) {
		var message = "[" + type + ": " + new Date().toLocaleString() + "] " + passed_arguments[0];
		if (passed_arguments.length > 1) {
			for(var i = 1; i < passed_arguments.length; i++) {
				var arg = passed_arguments[i];
				if (typeof(arg) == "object") {
					arg = Json.stringify(arg);
				}
				message = message.replace("{}", arg);
			}
		}
		return message;
	}

	function Logger() {
		this.debug = function debug() {
			try {
				if(this.isDebugEnabled && arguments.length > 0) {
					loggingConsole.log(_constructMessage("DEBUG", arguments));
				}
			} catch(exception) {
				return;
			}
		};

		this.info = function info() {
			try {
				if(this.isInfoEnabled && arguments.length > 0) {
					loggingConsole.info(_constructMessage("INFO", arguments));
				}
			} catch(exception) {
				return;
			}
		};

		this.setDebugEnabled = function setDebugEnabled(isEnabled) {
			this.isDebugEnabled = isEnabled;
		};

		this.setInfoEnabled = function setInfoEnabled(isEnabled) {
			this.isInfoEnabled = isEnabled;
		};
	}

	return Logger;
}) (console, JSON);