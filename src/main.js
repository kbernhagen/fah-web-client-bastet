/******************************************************************************\

                  This file is part of the Folding@home Client.

          The fah-client runs Folding@home protein folding simulations.
                    Copyright (c) 2001-2023, foldingathome.org
                               All rights reserved.

       This program is free software; you can redistribute it and/or modify
       it under the terms of the GNU General Public License as published by
        the Free Software Foundation; either version 3 of the License, or
                       (at your option) any later version.

         This program is distributed in the hope that it will be useful,
          but WITHOUT ANY WARRANTY; without even the implied warranty of
          MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
                   GNU General Public License for more details.

     You should have received a copy of the GNU General Public License along
     with this program; if not, write to the Free Software Foundation, Inc.,
           51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

                  For information regarding this software email:
                                 Joseph Coffland
                          joseph@cauldrondevelopment.com

\******************************************************************************/

import {createApp}    from 'vue'
import App            from './App.vue'
import router         from './router'
import Button         from './Button.vue'
import Dialog         from './Dialog.vue'
import ProgressBar    from './ProgressBar.vue'
import Award          from './Award.vue'
import HelpBalloon    from './HelpBalloon.vue'
import FAHLogo        from './FAHLogo.vue'
import ClientVersion  from './ClientVersion.vue'
import ViewHeader     from './ViewHeader.vue'
import MainHeader     from './MainHeader.vue'
import Cache          from './cache.js'
import API            from './api.js'
import Account        from './account.js'
import util           from './util.js'
import crypto         from './crypto.js'
import Node           from './node.js'
import Machines       from './machines.js'
import Stats          from './stats.js'
import Projects       from './projects.js'
import News           from './news.js'
import DirectMachConn from './direct-mach-conn.js'


async function main(url) {
  const app     = createApp(App);
  const ctx     = app.config.globalProperties
  ctx.$util     = util
  ctx.$crypto   = crypto
  ctx.$cache    = new Cache('fah')
  ctx.$api      = new API(ctx, url)
  ctx.$account  = new Account(ctx)
  ctx.$adata    = await ctx.$account.try_login()
  ctx.$machs    = new Machines(ctx)
  ctx.$node     = new Node(ctx)
  ctx.$projects = new Projects(ctx)
  ctx.$stats    = new Stats(ctx)
  ctx.$news     = new News(ctx)

  console.debug({account: Object.assign({}, ctx.$adata)})

  new DirectMachConn(ctx, 'local', util.default_address())

  app.use(router)
  app.component('Button',        Button)
  app.component('Dialog',        Dialog)
  app.component('ProgressBar',   ProgressBar)
  app.component('Award',         Award)
  app.component('HelpBalloon',   HelpBalloon)
  app.component('FAHLogo',       FAHLogo)
  app.component('ClientVersion', ClientVersion)
  app.component('ViewHeader',    ViewHeader)
  app.component('MainHeader',    MainHeader)
  app.mount('#app')
}


main(import.meta.env.VITE_API_URL || 'https://api.foldingathome.org')
