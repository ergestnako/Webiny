import Webiny from 'Webiny';
import Link from './Link';
import DownloadLink from './DownloadLink';

class Module extends Webiny.Module {

    init() {
        this.name = 'Link';
        Webiny.Ui.Components.Link = Link;
        Webiny.Ui.Components.DownloadLink = DownloadLink;
    }
}

export default Module;