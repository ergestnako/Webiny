import Webiny from 'Webiny';
import CodeHighlight from "../../../../../Core/Modules/CodeHighlight/CodeHighlight";

class ExportRoleModal extends Webiny.Ui.ModalComponent {

    constructor(props) {
        super(props);

        this.state = {
            content: ''
        };
    }

    componentWillMount() {
        super.componentWillMount();
        const _fields = 'name,slug,description,permissions[slug]';
        const api = new Webiny.Api.Endpoint('/entities/webiny/user-roles');
        return api.get(this.props.role.id, {_fields}).then(response => {
            const role = response.getData();
            role.permissions = _.map(role.permissions, 'slug');
            delete role.id;

            this.setState({
                content: JSON.stringify(role, null, 4)
            });
        });
    }

    renderDialog() {
        const {Modal, Button, Copy, CodeHighlight, Loader} = this.props;
        return (
            <Modal.Dialog wide>
                <Modal.Header title="Export Role"/>
                <Modal.Body>
                    {this.state.content ?
                        <CodeHighlight language="json">{this.state.content}</CodeHighlight>
                        :
                        <Loader style={{height: 200}}/>
                    }
                </Modal.Body>
                <Modal.Footer>
                    <Copy.Button label="Copy" type="primary" value={this.state.content} renderIf={this.state.content}/>
                </Modal.Footer>
            </Modal.Dialog>
        );
    }
}

export default Webiny.createComponent(ExportRoleModal, {modules: ['Modal', 'Button', 'Copy', 'CodeHighlight', 'Loader']});