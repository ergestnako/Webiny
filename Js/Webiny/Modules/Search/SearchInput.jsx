import Webiny from 'Webiny';
import styles from './Styles';

class SearchInput extends Webiny.Ui.FormComponent {

    constructor(props) {
        super(props);

        _.assign(this.state, {
            search: '',
            selected: null,
            options: []
        });

        this.warned = false;

        this.bindMethods(
            'inputChanged',
            'selectItem',
            'selectCurrent',
            'onKeyUp',
            'onBlur',
            'renderPreview',
            'getSearchInput',
            'fetchValue'
        );
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);
        const newState = {
            options: props.options
        };

        if (props.selected) {
            newState['selected'] = this.renderPreview(props.selected);
        }

        this.setState(newState);
    }

    renderPreview(item) {
        if (!item) {
            return null;
        }
        return this.props.selectedRenderer.call(this, item);
    }

    inputChanged(e) {
        this.setState({search: e.target.value});
        this.props.onSearch(e.target.value);
    }

    onKeyUp(e) {
        this.key = e.key;

        switch (this.key) {
            case 'Backspace':
                if (_.isEmpty(this.state.search) || this.props.valueLink.value) {
                    this.reset();
                } else {
                    this.inputChanged(e);
                }
                break;
            case 'ArrowDown':
                this.selectNext();
                break;
            case 'ArrowUp':
                this.selectPrev();
                break;
            case 'Enter':
                e.stopPropagation();
                e.preventDefault();
                this.selectCurrent();
                break;
            case 'Escape':
                this.onBlur();
                break;
            case 'ArrowLeft':
            case 'ArrowRight':
                break;
            default:
                this.inputChanged(e);
                break;
        }
    }

    onBlur() {
        const state = {options: []};
        if (!this.props.valueLink.value) {
            state['search'] = '';
            state['selected'] = null;
        }
        this.setState(state, this.validate);
    }

    selectItem(item) {
        this.setState({
            search: this.renderPreview(item),
            options: []
        });
        this.props.valueLink.requestChange(this.props.useDataAsValue ? item : item[this.props.valueAttr]);
        this.props.onSelect(item);
        setTimeout(this.validate, 10);
    }

    selectNext() {
        if (!this.state.options.length) {
            return;
        }

        let selected = this.state.selected;
        if (selected === null) {
            selected = -1;
        }
        selected++;

        if (selected >= this.state.options.length) {
            selected = this.state.options.length - 1;
        }

        this.setState({
            selected,
            search: this.renderPreview(this.state.options[selected])
        });
    }

    selectPrev() {
        if (!this.state.options.length) {
            return;
        }

        let selected = this.state.options.length - 1;
        if (this.state.selected <= selected) {
            selected = this.state.selected - 1;
        }

        if (selected < 0) {
            selected = 0;
        }

        this.setState({
            selected,
            search: this.renderPreview(this.state.options[selected])
        });
    }

    selectCurrent() {
        if (!this.state.options.length) {
            return;
        }

        const current = this.state.options[this.state.selected];
        this.selectItem(current);
    }

    reset() {
        this.setState({
            selected: null,
            search: '',
            options: []
        });
        this.props.valueLink.requestChange(null);
        this.props.onReset();
    }

    getSearchInput() {
        const inputProps = {
            type: 'text',
            readOnly: this.props.readOnly || false,
            className: 'form-control typeahead tt-input',
            placeholder: this.props.placeholder,
            autoComplete: 'off',
            spellCheck: 'false',
            dir: 'auto',
            style: styles.ttInput,
            onKeyDown: this.onKeyUp,
            onBlur: this.onBlur,
            value: this.state.search || this.state.selected || '',
            onChange: this.inputChanged,
            disabled: this.isDisabled()
        };

        // Render option
        const options = this.state.options.map((item, index) => {
            const itemClasses = {
                'search-item': true,
                'search-item-selected': index === this.state.selected,
                'col-sm-12': true
            };

            const linkProps = {
                onMouseDown: () => this.selectItem(item),
                onMouseOver: () => this.setState({selected: index, search: this.renderPreview(item)})
            };

            return (
                <div key={index} className={this.classSet(itemClasses)} style={{padding: 10}}>
                    <a href="javascript:void(0)" {...linkProps}>
                        {this.props.optionRenderer.call(this, item)}
                    </a>
                </div>
            );
        });

        let dropdownMenu = null;
        if (this.state.options.length > 0) {
            dropdownMenu = (
                <span style={styles.dropdownMenu}>
					<div className="tt-dataset-states">{options}</div>
				</span>
            );
        }

        // Create search input
        const iconClass = {};
        iconClass[this.props.inputIcon] = !this.props.loading;
        iconClass[this.props.loadingIcon] = this.props.loading;

        return (
            <div className="twitter-typeahead" style={styles.outerSpan}>
                <input {...inputProps}/>
                <span className={this.classSet(iconClass)} style={styles.icon}></span>
                {dropdownMenu}
            </div>
        );
    }

    fetchValue(item) {
        let value = _.get(item, this.props.textAttr);
        if (!value) {
            if (!this.warned) {
                console.warn(`Warning: Item attribute '${this.props.textAttr}' was not found in the results of '${this.props.name}'
                component.\nMissing or misspelled 'fields' parameter?`);
                this.warned = true;
            }
            value = item.id;
        }
        return value;
    }
}

SearchInput.defaultProps = {
    optionRenderer: function optionRenderer(item) {
        const value = this.fetchValue(item);
        const content = {__html: value.replace(/\s+/g, '&nbsp;')};
        return <div dangerouslySetInnerHTML={content}></div>;
    },
    selectedRenderer: function selectedRenderer(item) {
        return this.fetchValue(item);
    },
    valueAttr: 'id',
    textAttr: 'name',
    onSelect: _.noop,
    onReset: _.noop,
    onSearch: _.noop,
    inputIcon: 'icon-search',
    loadingIcon: 'animate-spin icon-network',
    placeholder: 'Type to search',
    useDataAsValue: false,
    renderer() {
        const input = this.getSearchInput();

        let label = null;
        if (this.props.label) {
            label = <label className="control-label">{this.props.label}</label>;
        }

        let validationMessage = null;
        let validationIcon = null;
        if (this.state.isValid === false) {
            validationMessage = <span className="help-block">{this.state.validationMessage}</span>;
            validationIcon = <span className="icon icon-bad"></span>;
        }

        const cssConfig = {
            'form-group': true,
            'error': this.state.isValid === false,
            'success': this.state.isValid === true
        };

        return (
            <div className={this.classSet(cssConfig)}>
                {label}
                <div className="clearfix"/>
                {input}
                {validationIcon}
                {validationMessage}
            </div>
        );
    }
};

export default SearchInput;
