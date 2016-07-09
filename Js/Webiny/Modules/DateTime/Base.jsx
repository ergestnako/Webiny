import Webiny from 'Webiny';

class Base extends Webiny.Ui.FormComponent {

    constructor(props) {
        super(props);
        this.valueChanged = false;

        this.bindMethods('setValue');
    }

    shouldComponentUpdate(nextProps, nextState) {
        const omit = ['children', 'key', 'ref', 'valueLink'];
        const oldProps = _.omit(this.props, omit);
        const newProps = _.omit(nextProps, omit);

        const newValue = nextProps.valueLink.value;
        const oldValue = this.props.valueLink.value;

        return !_.isEqual(newProps, oldProps) || !_.isEqual(newValue, oldValue) || !_.isEqual(nextState, this.state);
    }

    /**
     * Initialize DateTimePicker
     * @url https://eonasdan.github.io/bootstrap-datetimepicker/
     */
    componentDidMount() {
        super.componentDidMount();
        this.input = $(ReactDOM.findDOMNode(this)).find('input');
        this.input.datetimepicker({
            format: this.props.inputFormat,
            stepping: this.props.stepping,
            keepOpen: false,
            debug: this.props.debug || false,
            minDate: this.props.minDate ? new Date(this.props.minDate) : false,
            viewMode: this.props.viewMode
        }).on('dp.hide', e => {
            if (this.valueChanged) {
                this.onChange(e);
            }
            this.valueChanged = false;
        }).on('dp.change', () => {
            this.valueChanged = true;
        });

        this.setValue(this.props.valueLink.value);
    }

    componentDidUpdate() {
        super.componentDidUpdate();
        this.setValue(this.props.valueLink.value);
    }

    setValue(newValue) {
        this.input.val(newValue);

        if (this.props.minDate) {
            this.input.data('DateTimePicker').minDate(new Date(this.props.minDate));
        }
    }
}

Base.defaultProps = {
    debug: false,
    withTimezone: true,
    renderer() {
        const cssConfig = {
            'form-group': true,
            'error': this.state.isValid === false,
            'success': this.state.isValid === true
        };

        let label = null;
        if (this.props.label) {
            label = <label key="label" className="control-label">{this.props.label}</label>;
        }

        let validationMessage = null;
        if (this.state.isValid === false) {
            validationMessage = <span className="help-block">{this.state.validationMessage}</span>;
        }

        const props = {
            onBlur: this.validate,
            disabled: this.isDisabled(),
            stepping: this.props.stepping,
            readOnly: this.props.readOnly,
            type: 'text',
            className: this.classSet('form-control', {placeholder: !this.props.valueLink.value}),
            value: this.props.valueLink.value || '',
            onChange: this.onChange,
            placeholder: _.get(this.props.placeholder, 'props.children', this.props.placeholder)
        };

        return (
            <div className={this.classSet(cssConfig)}>
                {label}
                <div className="input-group date">
                    <input {...props}/>
                    <span className="input-group-addon cursor">
                        <i className="icon-calendar icon_c"></i>
                    </span>
                </div>
                {validationMessage}
            </div>
        );
    }
};

export default Base;
