"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = exports.UsageError = void 0;
var chalk_1 = require("chalk");
var CLIOption = /** @class */ (function () {
    function CLIOption(name, options) {
        this.name = name;
        this.alias = (options === null || options === void 0 ? void 0 : options.alias) || [];
        this.type = (options === null || options === void 0 ? void 0 : options.type) || "text";
        this.description = (options === null || options === void 0 ? void 0 : options.description) || "No description provided";
    }
    return CLIOption;
}());
var UsageError = /** @class */ (function (_super) {
    __extends(UsageError, _super);
    function UsageError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return UsageError;
}(Error));
exports.UsageError = UsageError;
var Command = /** @class */ (function () {
    function Command(name, opts) {
        this.description = "No description provided";
        this.help = true;
        this.helpHeader = "";
        this.opt = {};
        this.subcommands = [];
        this._handler = function () { };
        this.name = name;
        this.usageString = this.name + " [...options]";
        if (opts === null || opts === void 0 ? void 0 : opts.noDefaultHelpOption)
            this.options = [];
        else
            this.options = [
                new CLIOption("h", {
                    alias: ["help"],
                    type: "boolean",
                    description: "Display this help message",
                }),
            ];
    }
    /**
     * Add a description
     * @param message description
     */
    Command.prototype.describe = function (message) {
        this.description = message;
        return this;
    };
    /**
     * Disable the help message
     */
    Command.prototype.noHelp = function () {
        this.help = false;
        return this;
    };
    /**
     * Override the default usage string
     * @param usageString Usage String
     */
    Command.prototype.usage = function (usageString) {
        this.usageString = usageString;
        return this;
    };
    /**
     * Add an option
     * @param name Option names
     * @param alias Optionally any amount of aliases
     */
    Command.prototype.option = function (name, options) {
        this.options.push(new CLIOption(name, options));
        return this;
    };
    /**
     * Parse arguments into an object
     * @param argv Raw process arguments, without binary and file location (e.g. `process.argv.slice(2)`)
     */
    Command.prototype.parse = function (argv, options) {
        var _this = this;
        var res = {};
        var index = 0;
        var _loop_1 = function () {
            var isOption = false;
            var stripped = argv[index];
            while (stripped.startsWith("-")) {
                isOption = true;
                stripped = stripped.slice(1);
            }
            if (isOption) {
                var done_1 = false;
                this_1.options.forEach(function (option) {
                    if (option.name === stripped || option.alias.includes(stripped)) {
                        done_1 = true;
                        if (option.name === "parameters")
                            return;
                        if (option.type === "boolean") {
                            res[option.name] = true;
                        }
                        else if (option.type === "text") {
                            res[option.name] = argv[++index];
                        }
                        else if (option.type === "number") {
                            index++;
                            if (isNaN(parseFloat(argv[index]))) {
                                _this.renderHelp();
                                if (options === null || options === void 0 ? void 0 : options.noExit)
                                    throw new UsageError("Expected a number for option " + (option.name.length > 1 ? "-" : "--") + option.name);
                                process.exit();
                            }
                            else {
                                res[option.name] = argv[index];
                            }
                        }
                    }
                });
                if (!done_1) {
                    res[stripped] = argv[++index] || true;
                }
            }
            else {
                var found_1 = false;
                this_1.subcommands.forEach(function (cmd) {
                    if (cmd.name === stripped) {
                        found_1 = true;
                        cmd.callHandler(cmd.parse(argv.slice(index + 1)));
                    }
                });
                if (found_1) {
                    return { value: false };
                }
                else
                    Array.isArray(res.parameters)
                        ? res.parameters.push(stripped)
                        : (res.parameters = [stripped]);
            }
            index++;
        };
        var this_1 = this;
        while (index < argv.length) {
            var state_1 = _loop_1();
            if (typeof state_1 === "object")
                return state_1.value;
        }
        if (this.help &&
            (res.h || (this.opt.demandArgument && Object.keys(res).length === 0))) {
            this.renderHelp();
            return false;
        }
        return res;
    };
    /**
     * A message to display above the help message
     * @param message Message
     */
    Command.prototype.header = function (message) {
        this.helpHeader = message;
        return this;
    };
    /**
     * Show help and exit when no option or command is provided
     */
    Command.prototype.demandArgument = function (bool) {
        this.opt.demandArgument = bool || true;
        return this;
    };
    /**
     * Render the help message to the screen
     */
    Command.prototype.renderHelp = function () {
        var _a, _b, _c;
        console.log();
        if (this.helpHeader) {
            console.log(this.helpHeader);
            console.log();
        }
        console.log(chalk_1.white.bold("Usage:") + "\n\n  " + chalk_1.gray.bold("$") + " " + chalk_1.cyan(this.usageString) + "\n");
        console.log(chalk_1.white.bold("Options:") + "\n");
        var optionToString = function (option) {
            return [
                (option.name.length === 1 ? "-" : "--") + option.name,
                option.alias.map(function (alias) { return (alias.length === 1 ? " -" : "--") + alias; }),
            ].join(", ");
        };
        var longest = ((_a = this.options.map(optionToString).sort(function (a, b) { return b.length - a.length; })[0]) === null || _a === void 0 ? void 0 : _a.length) + 5;
        if (((_b = this.subcommands
            .map(function (cmd) { return cmd.name; })
            .sort(function (a, b) { return b.length - a.length; })[0]) === null || _b === void 0 ? void 0 : _b.length) +
            5 >
            longest) {
            longest =
                ((_c = this.subcommands
                    .map(function (cmd) { return cmd.name; })
                    .sort(function (a, b) { return b.length - a.length; })[0]) === null || _c === void 0 ? void 0 : _c.length) + 5;
        }
        this.options.forEach(function (option) {
            console.log("  " + chalk_1.cyan(optionToString(option)) + " " + chalk_1.gray(".").repeat(longest - optionToString(option).length) + " " + option.description);
        });
        console.log();
        if (this.subcommands.length > 0) {
            console.log(chalk_1.white.bold("Commands:") + "\n");
            this.subcommands.forEach(function (cmd) {
                console.log("  " + chalk_1.cyan(cmd.name) + " " + chalk_1.gray(".").repeat(longest - cmd.name.length) + " " + cmd.description);
            });
            console.log();
        }
    };
    /**
     * Called when the command is invoked as a subcommand
     * @param callback Callback
     */
    Command.prototype.handler = function (callback) {
        this._handler = callback;
        return this;
    };
    /**
     * Attach a subcommand
     * @param cmd Subcommand to attach
     */
    Command.prototype.command = function (cmd) {
        cmd.parent = this;
        this.subcommands.push(cmd);
        return this;
    };
    Command.prototype.root = function () {
        return this.parent ? this.parent.root() : this;
    };
    Command.prototype.callHandler = function (argv) {
        if (argv)
            this._handler(argv);
    };
    return Command;
}());
exports.Command = Command;
