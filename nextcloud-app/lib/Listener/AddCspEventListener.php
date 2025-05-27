<?php
Users\Philipp\Documents\GitHub\kicanvas-for-nextcloud\nextcloud-app\lib\Listener\AddCspEventListener.php
<?php
declare(strict_types=1);
// SPDX-FileCopyrightText: WARP <development@warp.lv>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\kicad_viewer\Listener;

use OCP\AppFramework\Http\EmptyContentSecurityPolicy;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\Security\CSP\AddContentSecurityPolicyEvent;

class AddCspEventListener implements IEventListener {

    public function handle(Event $event): void {
        if (!($event instanceof AddContentSecurityPolicyEvent)) {
            return;
        }
        $csp = new EmptyContentSecurityPolicy();
        $csp->addAllowedFrameDomain('\'self\'');
        $csp->addAllowedConnectDomain('blob:');
        $csp->addAllowedScriptDomain('\'self\'');
        $csp->addAllowedImageDomain('*');
        $csp->addAllowedFontDomain('\'self\'');
        
        // Use the modern approach instead of allowEvalScript if available
        if (method_exists($csp, 'addAllowedScriptDomain')) {
            $csp->addAllowedScriptDomain('\'unsafe-eval\'');
        } else {
            $csp->allowEvalScript(true);
        }
        
        $event->addPolicy($csp);
    }
}