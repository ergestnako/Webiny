<?php

namespace Apps\Webiny\Php\Services;

use Apps\Webiny\Php\Entities\AppNotification;
use Apps\Webiny\Php\Lib\Api\ApiContainer;
use Apps\Webiny\Php\Lib\AppNotifications\AbstractAppNotification;
use Apps\Webiny\Php\Lib\Services\AbstractService;

/**
 * Class AppNotifications
 */
class AppNotifications extends AbstractService
{
    protected static $classId = 'Webiny.Services.AppNotifications';

    protected function serviceApi(ApiContainer $api)
    {
        /**
         * @api.name Get notifications
         * @api.description Returns notifications for current user
         */
        $api->get('/', function () {
            $user = $this->wAuth()->getUser();
            $page = $this->wRequest()->getPage();
            $perPage = $this->wRequest()->getPerPage();

            // Filter types to only the ones user is subscribed to and is allowed to see
            $types = $this->arr($this->wAppNotifications()->getTypes())->filter(function ($type) use ($user) {
                return in_array($type::SLUG, $user->meta['appNotifications']) && $user->hasRole($type::ROLES);
            })->map(function ($type) {
                return $type::SLUG;
            })->values()->val();

            $query = ['type' => $types];
            $notifications = AppNotification::find($query, ['-createdOn'], $perPage, $page);

            $fields = 'id,createdOn,type,read,subject,text,template,data';
            return $this->apiFormatList($notifications, $this->wRequest()->getFields($fields));
        });

        /**
         * @api.name Get notification types
         * @api.description Returns array of notification types
         */
        $api->get('types', function () {
            $user = $this->wAuth()->getUser();
            $types = [];

            /* @var $class AbstractAppNotification */
            foreach ($this->wAppNotifications()->getTypes() as $class) {
                if ($user->hasRole($class::ROLES)) {
                    $types[] = [
                        'title'       => $class::TITLE,
                        'description' => $class::DESCRIPTION,
                        'type'        => $class::SLUG
                    ];
                }
            }

            return $types;
        });
    }
}