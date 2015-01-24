import BaseComponent from '/Core/Base/BaseComponent';

class Form extends BaseComponent {

	getTemplate(){ return '<div className="col-sm-12">\
    <form ref="form" className="form-inline">\
        <div className="form-group">\
            <input disabled="disabled" type="text" className="form-control" valueLink={this.linkState("id")} placeholder="ID"/><input ref="todoTask" type="text" className="form-control" valueLink={this.linkState("task")} placeholder="New task"/><button type="submit" onClick={this.saveTodo}>Save</button>\
        </div>\
    </form>\
</div>';
	}

	getFqn(){
		return 'Todo.Todo.FormComponent';
	}

	componentDidMount() {
		super();

		// Disable form submission
		var form = this.getNode('form');
		$(form).submit(function (e) {
			e.preventDefault();
		});
	}

	getInitialState() {
		this.taskStore = this.getStore('Todo.Todo.TaskStore');
		return {};
		return this.taskStore.getData().then((data) => {
			console.log(data)
			this.setState(data || {});
		});
	}

	saveTodo(){
		console.log(this.state)
		this.trigger('Todo.Todo.saveTask', this.state)
	}
}

export default Form;
