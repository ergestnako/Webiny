import Webiny from 'Webiny';
import SwitchButton from './SwitchButton';

class Switch extends Webiny.Ui.FormComponent {

}

Switch.defaultProps = _.merge({}, Webiny.Ui.FormComponent.defaultProps, {
    label: null,
    tooltip: null,
    renderer() {
        const props = {
            value: this.props.value,
            onChange: this.props.onChange,
            disabled: this.isDisabled()
        };

        return (
            <div className="form-group">
                {this.renderLabel()}
                <div className="clearfix"></div>
                <SwitchButton {...props}/>
                {this.renderDescription()}
            </div>
        );
    }
});

export default Switch;