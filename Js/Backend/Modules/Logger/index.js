import React from 'react';
import Webiny from 'webiny';
import Views from './Views/Views';

class Logger extends Webiny.App.Module {

    init() {
        this.name = 'Logger';
        const Menu = Webiny.Ui.Menu;
        const role = 'webiny-logger-manager';

        this.registerMenus(
            <Menu label="System" icon="icon-tools">
                <Menu label="Error Logger" route="Logger.ListErrors" role={role}/>
            </Menu>
        );

        this.registerRoutes(
            new Webiny.Route('Logger.ListErrors', '/logger/list', Views.Main, 'Logger - List Errors').setRole(role)
        );
    }
}

export default Logger;