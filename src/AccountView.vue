<!--

                  This file is part of the Folding@home Client.

          The fah-client runs Folding@home protein folding simulations.
                    Copyright (c) 2001-2024, foldingathome.org
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

-->

<script>
import Unit           from './unit.js'
import CommonSettings from './CommonSettings.vue'


function copy_config(config = {}) {
  return {
    dark:    config.dark,
    columns: (config.columns || []).concat([]),
    wide:    !!config.wide,
    compact: !!config.compact,
  }
}


function copy_account(data) {
  let cause = (!data.cause || data.cause == 'unspecified') ? 'any' : data.cause

  return {
    user:    data.user,
    team:    data.team    || 0,
    passkey: data.passkey || undefined,
    cause,
    avatar:  data.avatar  || undefined,
    node:    data.node    || undefined,
    config:  copy_config(data.config),
  }
}


export default {
  inheritAttrs: false,
  components: {CommonSettings},


  data() {
    return {
      account_new: {config: {}},
      confirmed:   false,
      show:        {},

      confirm_dialog_buttons: [
        {name: 'cancel',  icon: 'times'},
        {name: 'discard', icon: 'trash'},
        {name: 'save',    icon: 'floppy-o'}
      ],
    }
  },


  watch: {
    '$adata'() {if (this.$adata) this.init()},
    'account_new.config.dark'(x)    {this.$root.set_dark(x)},
    'account_new.config.wide'(x)    {this.$root.set_wide(x)},
    'account_new.config.compact'(x) {this.$root.set_compact(x)},
  },


  computed: {
    small()   {return document.body.clientWidth <= 800},
    columns() {return this.account_new.config.columns || []},


    unused_cols() {
      let used = this.columns
      let l = []

      for (let col of Unit.column_names)
        if (used.indexOf(col) == -1) l.push(col)

      return l
    },

    modified() {
      return !this.$util.isEqual(copy_account(this.account_new),
                                 copy_account(this.$adata))
    }
  },


  beforeRouteLeave(to, from) {
    if (!this.modified || this.confirmed) return true
    this.confirm_leave(to)
    return false
  },


  async mounted() {this.init()},


  methods: {
    init() {this.account_new = copy_account(this.$adata)},


    async logout() {
      await this.$root.logout()
      this.close()
    },


    async confirm_leave(to) {
      let response = await this.$refs.confirm_dialog.exec()

      switch (response) {
      case 'save': return this.save()

      case 'discard':
        this.confirmed = true
        this.$root.check_appearance()
        this.$router.push(to)
      }
    },


    async save() {
      return this.$root.pacify(async () => {
        try {
          await this.$account.save(copy_account(this.account_new))
          this.close()

        } catch (e) {
          if (e.error) e = e.error
          this.$root.message('error', 'Save Failed',
                             'Failed to save account settings: ' + e)
        }
      })
    },


    cancel() {this.close()},


    close() {
      this.confirmed = true
      this.$root.check_appearance()
      this.$router.back()
    },


    async reset_token() {this.$account.reset_token()},
    copy_token() {navigator.clipboard.writeText(this.$adata.token)},


    async confirm_delete() {
      let response = await this.$root.message(
        'confirm', 'Delete Account?',
        'Deleted accounts cannot be recovered. ' +
          'Are you sure you want to delete this account?',
        [
          {name: 'delete', icon: 'trash', text: 'Delete Account',
           class: 'button-caution'},
          {name: 'cancel', icon: 'times'}
        ])

      if (response == 'delete')
        return this.$root.pacify(async () => {
          await this.$account.delete()
          this.close()
        })
    },

    reset_columns() {this.account_new.config.columns = Unit.default_columns}
  }
}
</script>

<template lang="pug">
Dialog(:buttons="confirm_dialog_buttons", ref="confirm_dialog")
  template(v-slot:header) Unsaved changes
  template(v-slot:body).
    You have unsaved account changes.  Would you like to save your
    changes, discard them or cancel and stay on this page?

.account-view.page-view
  ViewHeader(title="Account Settings")
    template(v-slot:actions)
      Button(@click="cancel", text="Cancel", icon="times",
        title="Leave Account Settings with out making changes")

      Button(:disabled="!modified", @click="save", text="Save", success,
        icon="save", title="Save your changes and go back to the main page")

  .view-body(v-if="$adata")
    fieldset.settings.view-panel
      legend
        HelpBalloon(name="Account"): p.
          These settings affect all of the machines linked to your account.

      CommonSettings(:config="account_new")

      .setting
        HelpBalloon(name="Node"): p.
          A Folding@home node helps you connect to your remote clients.
          Unless otherwise instructed, it's best to leave the default value.

        input(v-model="account_new.node", pattern="[\\w\\-]+(\\.[\\w\\-]+)+")

      .setting
        HelpBalloon(name="Token")
          p.
            A token is used to connect your remote clients to your account.  You
            can pass your account token to a client to cause it to link to your
            account.  Once a machine is linked it will show up as one of your
            machines in your account.

          p.
            Anyone with your account token can link machines to your
            account.  Once you've used an account token it's a good idea to
            generate a new one.  Anytime you generate a new account token the
            previous account tokens are no longer valid.  But any machines which
            are already linked to you account will remain linked.

          p.
            If a client is running locally on the same machine you've logged in
            to your Folding@home account on, it will automatically be linked to
            your account.

        input(v-model="$adata.token", :class="{password: !show.token}",
          readonly)

        .setting-actions
          Button.button-icon(:icon="'eye' + (show.token ? '' : '-slash')",
            @click="show.token = !show.token",
            :title="(show.token ? 'Hide' : 'Show') + ' account token'")

          Button.button-icon(icon="refresh", @click="reset_token",
            title="Generate a new account token")

          Button.button-icon(icon="copy", @click="copy_token",
            title="Copy account token to clipboard")

    fieldset.settings.view-panel
      legend
          HelpBalloon(name="Appearance"): p.
            These settings change Web Control's appearance.  Note, some
            settings are only available on wide screens.

      .setting.dark-setting
        HelpBalloon(name="Dark mode"): p Enables the dark mode theme.
        input(v-model="account_new.config.dark", type="checkbox")

      .setting.compact-setting
        HelpBalloon(name="Compact"): p Decrease gaps between display elements.
        input(v-model="account_new.config.compact", type="checkbox")

      .setting.wide-setting(v-if="!small")
        HelpBalloon(name="Wide Display"): p Use full screen width.
        input(v-model="account_new.config.wide", type="checkbox")

      .columns-setting(v-if="!small")
        HelpBalloon(name="Work Unit Columns"): p.
          Drag and drop columns to change their position and visibility.
          Note, only the default columns are displayed on small screens.

        .drag-zones
          .drag-zone
            Button.button-icon(icon="refresh", @click="reset_columns",
              title="Reset columns to default")
            DragList(:list="columns")

          .drag-zone(title="Move disabled columns here")
            .fa.fa-trash
            DragList(:list="unused_cols", :removable="false")

  .actions
      Button(@click="logout", text="Logout", icon="sign-out")

      Button.button-caution(@click="confirm_delete", text="Delete Account",
        icon="trash", title="Permanently delete this account")
</template>

<style lang="stylus">
.account-view
  .view-body > .actions
    display flex

  legend > a
    display inline

  fieldset.settings .setting label
    width 7em

  .actions
    display flex
    gap var(--gap)

  .columns-setting
    width 100%

    label
      color var(--subtitle-color)

    .drag-zones
      display flex
      gap var(--gap)
      flex-direction column
      margin-top var(--gap)
      font-size 90%

      .drag-zone
        display flex
        gap var(--gap)
        align-items center

        .fa
          font-size 20pt
          width 1em

        .drag-list
          flex 1
          flex-wrap wrap

          li
            white-space nowrap
</style>
