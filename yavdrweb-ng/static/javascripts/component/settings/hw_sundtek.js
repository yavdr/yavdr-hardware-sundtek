YaVDR.Component.Settings.HwSundtek = Ext.extend(YaVDR.Component, {
      itemId : 'settings_hw_sundtek',
      description : _('You can configure your sundtek DVB hardware here.'),
      title : _('Settings'),
      initComponent : function() {
        this.sundtek = new YaVDR.Component.Settings.HwSundtek.Hardware;
        this.items = [new YaVDR.Component.Item({
              title : _('Sundtek'),
              style : 'margin-bottom: 5px',
              items : this.sundtek
            })];
        YaVDR.Component.Settings.HwAudio.superclass.initComponent.call(this);
      },
      doReload : function() {
        this.sundtek.doLoad();
      }
    });
YaVDR.registerComponent(YaVDR.Component.Settings.HwSundtek);

YaVDR.Component.Settings.HwSundtek.Hardware = Ext.extend(YaVDR.Default.Form, {
      defaults : {
        xtype : 'fieldset',
        layout : 'form',
        anchor : '100%',
        defaults : {
          anchor : '100%'
        }
      },
      initComponent : function() {

        this.sundtekStore = new Ext.data.JsonStore({
              idProperty : 'key',
              fields : [{
                    name : 'key'
                  }, {
                    type : 'boolean',
                    name : 'disabled'
                  }, {
                    name : 'title'
                  }, {
                    name : 'description'
                  }],
              data : [{
                    key : 'none',
                    title : _('unchanged'),
                    description : _('Do not change frontend settings')
                  }, {
                    key : 'DVBT',
                    title : _('DVB-T')
                  }, {
                    key : 'DVBC',
                    title : _('DVB-C')
                  }]

            });

        this.sundtekTpl = new Ext.XTemplate('<tpl for=".">', '<tpl if="disabled == true">', '<div class="selection-wrap unselectable" id="mode-selection-{key}">', '</tpl>', '<tpl if="disabled == false">', '<div class="selection-wrap selectable" id="mode-selection-{key}">',
            '</tpl>', '<div class="title">{title}</div>', '<div class="description">{description}</div>', '</div>', '</tpl>');

        this.sundtekTpl.compile();

        this.buttons = [{
              itemId : 'rescan',
              scope : this,
              text : _('Rescan Sundtek'),
              handler : this.doRescan,
              icon : '/icons/fugue/monitor--plus.png'
            }];
        this.items = [];

        YaVDR.Component.Settings.HwDisplay.Display.superclass.initComponent.call(this);
        // this.getComponent('basic').getComponent('enablenetwork').on('check',
        // this.onCheckNetwork, this);
      },
      doSave : function() {
        this.getForm().submit({
              url : '/sundtek/set_dvb',
              scope : this,
              success : function(form, action) {
                this.doLoad();
              }
            })
      },
      // onCheckNetwork: function(cb, checked) {
      // },
      renderSundtek : function(item, serial, found) {
        var items = [];
        try {
          if (typeof item.info != 'undefined') {
            if (found) {
              items.push({
                    xtype : 'hidden',
                    name : 'serials',
                    value : serial,
                    disabled : !found
                  });
            }

            if (item.info.capabilities.dvbc == "1" && item.info.capabilities.dvbt == "1") {

              var selectionHidden = new Ext.form.Hidden({
                    name : serial + '|mode',
                    disabled : !found
                  });
              items.push(selectionHidden);

              var value = item.mode;
              items.push(new YaVDR.SelectionList({
                    fieldLabel : _('DVB-Mode'),
                    hiddenField : selectionHidden,
                    tpl : this.sundtekTpl,
                    store : this.sundtekStore,
                    disabled : !found,
                    listeners : {
                      afterrender : function(list) {
                        var rec = this.store.getById(value);
                        list.select(rec);
                      }
                    }
                  }));
            }

            if (typeof item.info.ip != "undefined") { // remote
              // device
              items.push({
                    xtype : 'checkbox',
                    fieldLabel : _('mount device'),
                    name : serial + '|mount',
                    itemId : serial + '|mount',
                    id : serial + '|mount',
                    serial : serial,
                    inputValue : 1,
                    disabled : !found,
                    checked : (item.mount == 1),
                    listeners : {
                      scope : this,
                      check : function(cb, checked) {
                        var e = Ext.getCmp(cb.serial + '|static');
                        if (checked) {
                          e.enable();
                          if (e.avahi == 0)
                            e.setValue(true);
                        } else {
                          e.setValue(false);
                          e.disable();
                        }
                      }
                    }
                  });

              items.push({
                    xtype : 'checkbox',
                    fieldLabel : _('mount static (without avahi support)'),
                    name : serial + '|static',
                    itemId : serial + '|static',
                    id : serial + '|static',
                    inputValue : 1,
                    serial : serial,
                    avahi : (item.avahi ? 1 : 0),
                    disabled : (item.mount != 1),
                    checked : (item.static == 1 || item.avahi == 0),
                    listeners : {
                      scope : this,
                      check : function(cb, checked) {
                        var e = Ext.getCmp(cb.serial + '|mount');
                        if (cb.avahi == 0)
                          cb.setValue(e.getValue());
                      }
                    }
                  });

              items.push({
                    itemId : serial + '|mounted',
                    name : serial + '|mounted',
                    xtype : 'label',
                    fieldLabel : _('mounted'),
                    text : (typeof item.mounted != 'undefined' ? _('yes') : _('no'))
                  });
              /*
               * items.push({ disabled: true, itemId: serial + '|mounted', name:
               * serial + '|mounted', xtype: 'radio', fieldLabel: _('mounted'),
               * boxLabel: _('yes'), inputValue: 1, checked: (item.mounted == 1)
               * });
               */
            }

            if (item.info.capabilities.remote == "1" && typeof item.info.ip == "undefined") {
              items.push({
                    itemId : serial + '|remote',
                    xtype : 'label',
                    fieldLabel : _('LIRC'),
                    text : _('sundtec remote can be configured in the Remote Control panel')
                  });
            }
            if (!found) {
              items.push({
                    xtype : 'button',
                    text : _('remove this configuration'),
                    handler : function(btn) {
                      Ext.Msg.confirm(_('remove this configuration'), _('Do you realy want to remove this configration:'), function(btn, text) {
                            if (btn == 'yes') {
                              Ext.Ajax.request({
                                    url : '/sundtek/remove_dvb',
                                    params : {
                                      serial : serial
                                    },
                                    success : function() {
                                      this.doLoad();
                                    },
                                    failure : function() {
                                      this.doLoad();
                                    },
                                    scope : this
                                  });
                            }
                          }, this);
                    },
                    scope : this
                  });
            }

            this.insert(this.items.length, {
                  itemData : item,
                  itemId : serial + '|sundtek',
                  title : item.info.devicename + (typeof item.info.ip != "undefined" ? ' @ ' + item.info.ip + ':' + item.info.id : _(' (local)')) + (item.avahi ? " (" + _("avahi support detected") + ")" : ""),
                  items : items
                });
          }
        } catch (e) {
        }
      },
      doLoad : function() {
        Ext.Ajax.request({
              url : '/sundtek/get_dvb',
              method : 'GET',
              scope : this,
              success : function(xhr) {
                var sundtekData = Ext.decode(xhr.responseText);
                var basic = this.getComponent('basic');
                this.removeAll(true);
                if (sundtekData !== false) {
                  this.insert(1, {
                        itemId : 'basic',
                        title : _('Basic settings'),
                        items : [{
                          itemId : 'enablenetwork',
                          name : 'enablenetwork',
                          xtype : 'checkbox',
                          fieldLabel : _('Network-Support'),
                          boxLabel : _('allows devices to be mounted remotely'),
                          inputValue : 1,
                          checked : sundtekData.sundtek.enablenetwork == "1"
                            // listeners: {
                            // scope: this,
                            // check:
                            // this.onCheckNetwork
                            // }
                          }]
                      });

                  var notfound = new Array();
                  Ext.iterate(sundtekData.sundtek.stick, function(key, item) {
                        var sundtek = this.getComponent(key + '|sundtek');
                        if (sundtek) {
                          sundtek.destroy();
                        }
                        var found = false;
                        if (typeof sundtekData.sundtek.found != "undefined") {
                          Ext.iterate(sundtekData.sundtek.found, function(index, foundIndex) {
                                if (key == foundIndex) {
                                  found = true;
                                }
                              });
                        }
                        if (found) {
                          this.renderSundtek.call(this, item, key, true);
                        } else {
                          notfound[notfound.length] = new Array(item, key);
                        }
                      }, this);

                  for (i = 0; i < notfound.length; i++) {
                    this.renderSundtek.call(this, notfound[i][0], notfound[i][1], false);
                  }
                }
                this.doLayout();

                // networking setting
                // basic.getComponent('enablenetwork').setValue(sundtekData.sundtek.enablenetwork);
              }
            });
      },
      doRescan : function() {
        Ext.getBody().mask(_('Rescan for sundtek devices.'), 'x-mask-loading');

        Ext.Ajax.request({
              url : '/sundtek/rescan',
              timeout : 3000,
              method : 'GET',
              scope : this,
              success : function(xhr) {
                this.doLoad();
                Ext.getBody().unmask();
              },
              failure : function() {
                Ext.getBody().unmask();
              }
            });
      }
    });

YaVDR.Component.Settings.addMenu('hw', 'settings_hw_sundtek', 'Sundtek', 'sundteklogo', '/static/images/icons/');

YaVDR.Component.Settings.HwSundtek.HwRemote = Ext.extend(YaVDR.getComponent('settings-hw-remote'), {
      initComponent : function() {

        YaVDR.Component.Settings.HwSundtek.HwRemote.superclass.initComponent.call(this);
        this.sundtek = new YaVDR.Component.Settings.HwSundtek.LIRC;
        this.items.add(new YaVDR.Component.Item({
              title : _('Sundtek'),
              style : 'margin-top: 5px',
              items : this.sundtek
            }));

        this.on('render', this.doLoad, this);
      },

      doReload : function() {
        this.sundtek.doLoad();
      }
    });
YaVDR.registerComponent(YaVDR.Component.Settings.HwSundtek.HwRemote);

YaVDR.Component.Settings.HwSundtek.LIRC = Ext.extend(YaVDR.Default.Form, {
      defaults : {
        xtype : 'fieldset',
        layout : 'form',
        anchor : '100%',
        defaults : {
          anchor : '100%'
        }
      },
      initComponent : function() {

        this.items = [];

        this.protocolStore = new Ext.data.JsonStore({
              idProperty : 'key',
              fields : [{
                    name : 'key'
                  }, {
                    name : 'title'
                  }],
              data : [{
                    key : 'RC5',
                    title : 'RC5'
                  }, {
                    key : 'NEC',
                    title : 'NEC'
                  }, {
                    key : 'RC6',
                    title : 'RC6'
                  }, {
                    key : 'RC6A',
                    title : 'RC6A'
                  }, {
                    key : 'none',
                    title : 'none'
                  }]
            });

        this.protocolTpl = new Ext.XTemplate('<tpl for=".">', '<div class="selection-wrap selectable" id="mode-selection-{key}">', '<div class="title">{title}</div>', '</div>', '</tpl>');

        this.mapStore = new Ext.data.JsonStore({
              url : '/sundtek/get_keymaps',
              // reader configs
              root : 'keymaps',
              idProperty : 'key',
              fields : ['key', 'name', 'dir'],
              autoLoad : true
            });
        this.mapStore.load();

        YaVDR.Component.Settings.HwSundtek.LIRC.superclass.initComponent.call(this);
      },
      renderSundtek : function(item, serial, found) {
        // handle missing values
        item.config = item.config || {};
        item.config.remote = item.config.remote || {
          enabled : 0
        };
        item.config.remote.protocol = item.config.remote.protocol|| 'none';
        item.config.remote.map = item.config.remote.map || 'none';

        var items = [];
        try {
          if (typeof item.info != 'undefined') {
            if (found) {
              items.push({
                    xtype : 'hidden',
                    name : 'serials',
                    value : serial,
                    disabled : false
                  });
            }

            if (item.info.capabilities.remote == "1" && typeof item.info.ip == "undefined") {
              
              var combo = new Ext.form.ComboBox({
                    itemId : serial + '|mapId',
                    name : serial + '|mapId',
                    // tpl : this.mapTpl,
                    hiddenName : serial + '|map',
                    valueField : 'key',
                    anchor : '100%',
                    displayField : 'name',
                    typeAhead : true,
                    forceSelection : true,
                    mode : "local",
                    store : this.mapStore,
                    triggerAction : 'all',
                    fieldLabel : _('Key Map'),
                    selectOnFocus : true,
                    value : item.config.remote.map,
                    disabled : !found || item.config.remote.enabled == 0,
                    listeners : {
                      afterrender : function(combobox) {
                        var rec = combobox.store.getById(item.config.remote.map);
                        combobox.setValue(rec.id);
                      }
                    }
                  });

              var selectionHidden = new Ext.form.Hidden({
                    name : serial + '|protocol',
                    disabled : !found
                  });
              items.push(selectionHidden);

              var protocolValue = item.config.remote.protocol;
              var list = new YaVDR.SelectionList({
                    fieldLabel : _('IR Protocol'),
                    hiddenField : selectionHidden,
                    itemId : serial + '|protocollist',
                    name : serial + '|protocollist',
                    id : serial + '|protocollist',
                    tpl : this.protocolTpl,
                    store : this.protocolStore,
                    disabled : !found || item.config.remote.enabled == 0,
                    listeners : {
                      afterrender : function(list) {
                        var rec = list.store.getById(protocolValue);
                        list.select(rec);
                      }
                    }
                  });

              items.push({
                    xtype : 'checkbox',
                    fieldLabel : _('remote enabled'),
                    name : serial + '|enable',
                    itemId : serial + '|enable',
                    id : serial + '|enable',
                    inputValue : 1,
                    checked : (item.config.remote.enabled == 1),
                    disabled : !found,
                    combo : combo,
                    list : list,
                    listeners : {
                      scope : this,
                      check : function(cb, checked) {
                        var parent = this.findParentByType('form');
                        if (checked) {
                          cb.combo.enable();
                          cb.list.enable();
                        } else {
                          cb.combo.disable();
                          cb.list.disable();
                        }
                      }
                    }
                  });

              items.push(combo);
              items.push(list);

              this.insert(this.items.length, {
                    itemData : item,
                    itemId : serial + '|sundtek',
                    title : item.info.devicename,
                    items : items
                  });

            }
          }
        } catch (e) {
        }
      },
      doLoad : function() {
        Ext.Ajax.request({
              url : '/sundtek/get_dvb',
              method : 'GET',
              scope : this,
              success : function(xhr) {
                var sundtekData = Ext.decode(xhr.responseText);
                this.removeAll(true);
                if (sundtekData !== false) {

                  var notfound = new Array();
                  Ext.iterate(sundtekData.sundtek.stick, function(key, item) {
                        var sundtek = this.getComponent(key + '|sundtek');
                        if (sundtek) {
                          sundtek.destroy();
                        }
                        var found = false;
                        if (typeof sundtekData.sundtek.found != "undefined") {
                          Ext.iterate(sundtekData.sundtek.found, function(index, foundIndex) {
                                if (key == foundIndex) {
                                  found = true;
                                }
                              });
                        }
                        if (found) {
                          this.renderSundtek.call(this, item, key, true);
                        } else {
                          notfound[notfound.length] = new Array(item, key);
                        }
                      }, this);

                  for (i = 0; i < notfound.length; i++) {
                    this.renderSundtek.call(this, notfound[i][0], notfound[i][1], false);
                  }
                }
                this.doLayout();
              }
            });
      },
      doSave : function() {
        this.getForm().submit({
              url : '/sundtek/set_lirc',
              scope : this,
              success : function(form, action) {
                this.doLoad();
              }
            })
      }
      ,
    });
