import _ from 'lodash';
import React from 'react';
import md5 from 'blueimp-md5';
import isMobile from 'ismobilejs';
import classNames from 'classnames';
import Webiny from 'webiny';
import LinkState from './LinkState';
import Dispatcher from './Dispatcher';

class Component extends React.Component {

    constructor(props) {
        super(props);

        this.__listeners = [];
        this.__cursors = [];
        this.__mounted = true;
        this.bindMethods('bindTo', 'isRendered', 'i18n');


        /**
         * If set, it will be used in the component instead of dynamically created key
         * @type {null}
         */
        this.i18n.key = null;
    }

    /**
     * Method for a more convenient use of i18n module - this will automatically generate a complete namespace for the label
     * If this method is called without parameters, it will return Webiny.i18n module, from which you can use other functions as well
     * @param label
     * @param variables
     * @param options
     * @returns {*}
     */
    i18n(label, variables, options = {}) {
        if (!label) {
            return Webiny.i18n;
        }

        let key = options.key || _.get(this.props, 'i18nKey', this.i18n.key);
        if (!key) {
            const app = _.get(Webiny.Router.getActiveRoute(), 'module.app.name');
            const module = _.get(Webiny.Router.getActiveRoute(), 'module.name');
            key = `${app}.${module}.${this.getClassName()}`;
        }

        key = _.trimEnd(key, '.') + '.' + md5(label);
        return Webiny.i18n.render(key, label, variables, options);
    }

    componentWillMount() {
        // Reserved for future system-wide functionality
    }

    componentDidMount() {
        // Reserved for future system-wide functionality
        if (this.props.onComponentDidMount) {
            this.props.onComponentDidMount(this);
        }
    }

    /* eslint-disable */
    componentWillReceiveProps(nextProps) {
        // Reserved for future system-wide functionality
    }

    shouldComponentUpdate(nextProps, nextState) {
        // Reserved for future system-wide functionality
        return true;
    }

    componentWillUpdate(nextProps, nextState) {
        // Reserved for future system-wide functionality
    }

    componentDidUpdate(prevProps, prevState) {
        // Reserved for future system-wide functionality
    }

    /* eslint-enable */

    componentWillUnmount() {
        // Release event listeners
        _.forEach(this.__listeners, unsubscribe => {
            unsubscribe();
        });
        this.__listeners = [];

        // Release data cursors
        _.forEach(this.__cursors, cursor => {
            if (cursor && cursor.tree) {
                cursor.release();
            }
        });
        this.__cursors = [];

        this.__mounted = false;
    }

    setState(key, value = null, callback = null) {
        if (!this.isMounted()) {
            return;
        }

        if (_.isObject(key)) {
            return super.setState(key, value);
        }

        if (_.isString(key)) {
            const state = this.state;
            _.set(state, key, value);
            return super.setState(state, callback);
        }
    }

    isMounted() {
        return this.__mounted;
    }

    isRendered() {
        if (_.has(this.props, 'renderIf')) {
            return _.isFunction(this.props.renderIf) ? this.props.renderIf() : this.props.renderIf;
        }
        return true;
    }

    getClassName() {
        return Object.getPrototypeOf(this).constructor.name;
    }

    isMobile() {
        return isMobile.any;
    }

    dispatch(action, data) {
        return Dispatcher.dispatch(action, data);
    }

    on(event, callback) {
        const stopListening = Dispatcher.on(event, callback);
        this.__listeners.push(stopListening);
        return stopListening;
    }

    classSet(...sets) {
        return classNames(...sets);
    }

    /**
     * @param key
     * @param callback
     * @param defaultValue
     * @returns {{value: *, onChange: *}}
     */
    bindTo(key, callback = _.noop, defaultValue = null) {
        const ls = new LinkState(this, key, callback, _.clone(defaultValue));
        return ls.create();
    }

    bindMethods(...methods) {
        if (methods.length === 1 && _.isString(methods[0])) {
            methods = methods[0].split(',').map(x => x.trim());
        }

        _.forEach(methods, (name) => {
            if (name in this) {
                this[name] = this[name].bind(this);
            } else {
                console.info('Missing method [' + name + ']', this);
            }
        });
    }

    watch(key, func) {
        let cursor = null;
        if (_.isFunction(key)) {
            cursor = Webiny.Model.select();
            func = key;
        } else {
            cursor = Webiny.Model.select(key.split('.'));
        }

        cursor.on('update', e => {
            func(e.data.currentData, e.data.previousData, e);
        });

        this.__cursors.push(cursor);
        // Execute callback with initial data
        func(cursor.get());
        return cursor;
    }

    render() {
        if (!this.isRendered()) {
            return null;
        }

        if (this.props.renderer) {
            try {
                return this.props.renderer.call(this, {props: this.props, state: this.state});
            } catch (e) {
                Webiny.Logger && Webiny.Logger.reportError('js', e.message, e.stack);
                if (DEVELOPMENT) {
                    console.error('[RENDER ERROR][' + this.getClassName() + ']', e);
                    return (
                        React.createElement('div', null, [
                            React.createElement('h3', null, '[RENDER ERROR] in component `' + this.getClassName() + '`'),
                            React.createElement('pre', null, e.stack)
                        ])
                    );
                }
            }
        }

        return null;
    }
}

Component.defaultProps = {};

export default Component;
