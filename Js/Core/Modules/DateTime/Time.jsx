import BaseDateTime from './Base';

class Time extends BaseDateTime {

}

Time.defaultProps = _.merge({}, BaseDateTime.defaultProps, {
    disabled: false,
    readOnly: false,
    placeholder: '',
    inputFormat: 'HH:mm',
    modelFormat: 'HH:mm:ss',
    stepping: 15,
    withTimezone: false
});

export default Time;