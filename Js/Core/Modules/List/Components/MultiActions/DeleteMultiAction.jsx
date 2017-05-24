import Webiny from 'Webiny';
const Ui = Webiny.Ui.Components;

class DeleteMultiAction extends Webiny.Ui.Component {

    constructor(props) {
        super(props);
        this.bindMethods('delete,formatMessage');
    }

    formatMessage() {
        return this.props.message.replace('{count}', this.props.data.length);
    }

    delete(modalActions) {
        return this.props.actions.api.post('delete', {ids: _.map(this.props.data, 'id')}).then(res => {
            if (!res.isError()) {
                Webiny.Growl.success(this.props.data.length + ' records deleted successfully!');
                this.props.actions.reload();
            } else {
                Webiny.Growl.danger(res.getError(), 'Delete failed', true);
            }
            modalActions.hide();
        });
    }
}

DeleteMultiAction.defaultProps = {
    label: 'Delete',
    title: 'Delete confirmation',
    message: 'Do you really want to delete {count} record(s)?',
    renderer() {
        return (
            <Ui.List.ModalMultiAction label={this.props.label} data={this.props.data}>
                {(data, actions, modalActions) => {
                    const props = {
                        title: this.props.title,
                        message: this.formatMessage(),
                        onConfirm: () => this.delete(modalActions)
                    };
                    return (
                        <Ui.Modal.Confirmation {...props}/>
                    );
                }}
            </Ui.List.ModalMultiAction>
        );
    }
};

export default DeleteMultiAction;