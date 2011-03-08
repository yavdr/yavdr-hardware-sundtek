YaVDR.Component.Settings.HwSundtek = Ext.extend(YaVDR.Component, {
  itemId: 'settings_hw_sundtek',
  description: 'You can configure your sundtek DVB hardware here.',
  title: 'Sundtek',
  initComponent: function() {
	this.sundtek = new YaVDR.Component.Settings.HwSundtek.Hardware;
	this.items = [
	  new YaVDR.Component.Item({
		title: 'Sundtek Settings',
		style: 'margin-bottom: 5px',
		items: this.sundtek
	  })
	];
	YaVDR.Component.Settings.HwAudio.superclass.initComponent.call(this);
  },
  doReload: function() {
	this.sundtek.doLoad();  
  }
});
YaVDR.registerComponent(YaVDR.Component.Settings.HwSundtek);


YaVDR.Component.Settings.HwSundtek.Hardware = Ext.extend(YaVDR.Default.Form, {
  defaults: {
    xtype: 'fieldset',
    layout: 'form',
    anchor: '100%',
    defaults: {
      anchor: '100%'
    }
  },
  initComponent: function() {

    this.sundtekStore = new Ext.data.JsonStore({
      fields: [
        { name: 'key' },
        { type: 'boolean', name: 'disabled' },
        { name: 'title' },
        { name: 'description' }
      ],
      data: [
        {
          key: 'none',
          title: _('unchanged'),
          description: _('Do not change frontend settings')
        },
        {
          key: 'DVBT',
          title: _('DVB-T')
        },
        {
          key: 'DVBC',
          title: _('DVB-C')
        }
      ]

    });

    this.sundtekTpl = new Ext.XTemplate(
      '<tpl for=".">',
      '<tpl if="disabled == true">',
      '<div class="selection-wrap unselectable" id="frontend-selection-{key}">',
      '</tpl>',
      '<tpl if="disabled == false">',
      '<div class="selection-wrap selectable" id="frontend-selection-{key}">',
      '</tpl>',
      '<div class="title">{title}</div>',
      '<div class="description">{description}</div>',
      '</div>',
      '</tpl>'
      );

    this.sundtekTpl.compile();

    this.buttons = [
    {
      itemId: 'rescan',
      scope: this,
      text: _('Rescan Sundtek'),
      handler: this.doRescan,
      icon: '/icons/fugue/monitor--plus.png'
    }];
    this.items = [
      {
        itemId: 'basic',
        title: _('Basic settings'),
        items: [
          {
            itemId: 'enablenetwork',
            name: 'enablenetwork',
            xtype: 'checkbox',
            fieldLabel: _('Network-Support'),
            boxLabel: _('allow deviced to be mounted remotely'),
            inputValue: 1,
            listeners: {
              scope: this,
              check: this.onCheckNetwork
            }
          }
        ]
      }];

      YaVDR.Component.Settings.HwDisplay.Display.superclass.initComponent.call(this);
      this.getComponent('basic').getComponent('enablenetwork').on('check', this.onCheckNetwork, this);
  },
  doSave: function() {
    this.getForm().submit({
      url: '/sundtek/set_dvb',
      scope: this,
      success: function (form, action) {
        this.doLoad();
      }
    })
  },
  onCheckNetwork: function(cb, checked) {
  },
  renderSundtek: function(item, serial, found) {
    var items = [];
    
    if (item.info.capabilities.dvbc == "1" && item.info.capabilities.dvbt == "1") {
      var selectionHidden = new Ext.form.Hidden({
        name: 'mode_' + serial,
        value: 'none',
        disabled: !found
      });

      items.push(selectionHidden);  
      items.push(new YaVDR.SelectionList({
        fieldLabel: _('DVB-Mode'),
        hiddenField: selectionHidden,
        tpl: this.sundtekTpl,
        store: this.sundtekStore,
        disabled: !found
      }));      
    }
    
    if (typeof item.info.ip != "undefined") { // remote device
      items.push({
        xtype: 'checkbox',
        fieldLabel: _('mount device'),
        name: 'mount|' + serial,
        value: '0',
        disabled: !found
      });
      
      items.push({
        disabled: true,
        itemId: 'mounted_' + serial,
        name: 'mounted_' + serial,
        xtype: 'checkbox',
        fieldLabel: _('mounted'),
        boxLabel: 'yes',
        inputValue: 1//,
        //listeners: {
        //  scope: this,
        //  check: this.onMountedCheck
        //}
      });
    }
    
    if (!found) {
      items.push({
        xtype: 'button',
        text: _('remove this configuration')
      });
    }
/*
    items.push({
      hideLabel: true,
      xtype: 'displayfield',
      value: _('Device') + ': ' + item.devicename + ', ' + 'modeline' + ': ' + item.current.modeline.x + 'x' + item.current.modeline.y + ' ' + item.current.modeline.name + ' Hz'
    });

    items.push({
      xtype: 'hidden',
      name: 'display' + index,
      value: item.devicename
    });

    items.push({
      xtype: 'radio',
      index: index,
      itemId: 'primary',
      name: 'primary',
      fieldLabel: _('Primary'),
      inputValue: item.devicename,
      checked: item.primary,
      listeners: {
        scope: this,
        check: this.onPrimaryCheck
      }
    });

    items.push({
      xtype: 'radio',
      index: index,
      disabled: true,
      itemId: 'secondary',
      name: 'secondary',
      fieldLabel: _('Secondary'),
      inputValue: item.devicename,
      checked: item.secondary
    });

    var modelines = new Ext.data.JsonStore({
      idIndex: 0,
      fields: [
        "id",
        "modes"
      ],
      data : item.modelines
    });

    var resolution = null;
    if (item.current.modeline.x>0) {
        if (item.current.id == "nvidia-auto-select") {
            resolution = "nvidia-auto-select";
        } else {
            resolution = item.current.modeline.x + 'x' + item.current.modeline.y;
        }
    } else {
        resolution = 'disabled';
    }
    items.push(new YaVDR.EasyComboBox({
      itemId: 'modeline',
      index: index,
      store: modelines,
      inputValue: 'temporal',
      emptyText: _('Select resolution'),
      fieldLabel: _('Resolution'),
      hiddenName: 'modeline' + index,
      value: resolution,
      listeners: {
        scope: this,
        select: this.onModelineSelect,
        render: function(combo) {
          var display = this.getComponent('display_' + combo.index);
          var record = combo.getStore().getById(combo.getValue());
          if (record) {
            this.buildFrequencies.call(this, display, record);
          }
        }
      }
    }));

    items.push({
      xtype: 'spinnerfield',
      itemId: 'nvidia-overscan-slider' + index,
      width: 100,
      anchor: false,
      name: 'overscan' + index,
      increment: 1,
      keyIncrement: 1,
      minValue: '0',
      maxValue: 255,
      fieldLabel: _('Nvidia overscan compensation'),
      useTip: true,
      value: parseInt(item.overscan)
    });
*/
    this.insert(this.items.length, {
      //index: index,
      itemData: item,
      itemId: 'sundtek_' + serial,
      title: item.info.devicename + (typeof item.info.ip != "undefined"?' @ ' + item.info.ip + ':' + item.info.id:_(' (local)')),
      items: items
    });

  },
  doLoad: function() {
    Ext.Ajax.request({
      url: '/sundtek/get_dvb',
      method: 'GET',
      scope: this,
      success: function(xhr) {
        var sundtekData = Ext.decode(xhr.responseText);
        var basic = this.getComponent('basic');

        var notfound = new Array();
        Ext.iterate(sundtekData.sundtek.stick, function(key, item) {
          var sundtek = this.getComponent('sundtek_' + key);
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

        for(i = 0; i < notfound.length; i++) {
          this.renderSundtek.call(this, notfound[i][0], notfound[i][1], false);
        }
        this.doLayout();

        // Setzte networking setting
        basic.getComponent('enablenetwork').setValue(sundtekData.sundtek.enablenetwork);
      }
    });
  },
  doRescan: function() {
      Ext.getBody().mask(_('Rescan for sundtek devices.'), 'x-mask-loading');

      Ext.Ajax.request({
        url: '/sundtek/rescan',
        timeout: 3000,
        method: 'GET',
        scope: this,
        success: function(xhr) {
          this.doLoad();
          Ext.getBody().unmask();
        },
        failure:function() {
          Ext.getBody().unmask();
        }
      });
  }
});

YaVDR.Component.Settings.addMenu('hw', 'settings_hw_sundtek', 'Sundtek', '/static/images/icons/sundteklogo.png');