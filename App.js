Ext.define('CustomApp', {
	extend: 'Rally.app.App',
	componentCls: 'app',
	items: [
		{
			xtype: 'container',
			itemId: 'filter'
		},
		{
			xtype: 'container',
			itemId: 'grid'
		}
	],

	launch: function() {	
		//create the combo box
		this._createPatchesCombobox();
		this._onLoad(); //calling this manually.  The combobox "ready" event does not seem to be firing
	},
		
	_createPatchesCombobox: function() {
		var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

		//get the default monthly patch
		var today = new Date();
		var currentPatch = monthNames[today.getMonth()] + " " + today.getFullYear() + " Patch";

		//create store for custom drop down values
		var monthlyPatchStore = this._createPatchesStore(monthNames);

		var patchSelector = Ext.create('Ext.form.ComboBox', {
			fieldLabel: 'Select Patch',
			itemId: 'monthlyPatchCombobox',
			store: monthlyPatchStore,
			queryMode: 'local',
			displayField: 'Name',
			valueField: 'Name',
			listeners: {
				select: this._onSelect,
				ready: this._onLoad, //need to revisit why this is not firing
				scope: this
			}
		});
		
		this.down('#filter').add(patchSelector); //add to filter container
		patchSelector.setValue(currentPatch); //set to the current patch
	},
	
	_createPatchesStore: function(monthNames) {
				
		//the first drop down value should be 9 months ago
		var today = new Date();
		var startDate = new Date();
		startDate.setDate(today.getDate());
		startDate.setMonth(startDate.getMonth() - 9);

		//the last drop down value should be 3 months from now
		var endDate = new Date();
		endDate.setDate(today.getDate());
		endDate.setMonth(endDate.getMonth() + 3);

		//build the drop down values
		var thisYearsPatches = [];
		while (startDate.valueOf() != endDate.valueOf())
		{
			var newDropDownItem = monthNames[startDate.getMonth()] + " " + startDate.getFullYear() + " Patch";
			thisYearsPatches.push({ Name: newDropDownItem });
			startDate.setMonth(startDate.getMonth() + 1);
		}
		
		var store = Ext.create('Ext.data.Store', {
			fields: ['Name'],
			data: thisYearsPatches
		});
		
		return store;
	},
	
	_onLoad : function() {
	
		//console.log('Loading Defect Model');
		Rally.data.ModelFactory.getModel({
			type: 'Defect',
			success: this._onDefectModelRetrieved,
			scope: this
		});
		
		//console.log('Loading User Story Model');
		Rally.data.ModelFactory.getModel({
			type: 'User Story',
			success: this._onUserStoryModelRetrieved,
			scope: this
		});
		
		//console.log('Loading Feature Model');
		Rally.data.ModelFactory.getModel({
			type: 'PortfolioItem',
			success: this._onFeatureModelRetrieved,
			scope: this
		});
		
	},
	
	_onSelect: function() {
		
		//console.log('Select changed: ' + this.down('#monthlyPatchCombobox').getValue());
		
		this.down('#defectGrid').filter(this._getFilter(), true, true);
		this.down('#storyGrid').filter(this._getFilter(), true, true);
		this.down('#featureGrid').filter(this._getFilter(), true, true);
		
	},
	
	_onDefectModelRetrieved: function(model) {
		
		//console.log('Loaded Defect grid with: ' + this.down('#monthlyPatchCombobox').getValue());
	
		var columns = [
			'FormattedID',
			'Name',
			'ScheduleState',
			'Project',
			'Owner',
			'Iteration',
			'State',
			'TargetBranch',
			'Tags'
		];
		
		this._createGrid(model, 'defectGrid', 'Defects', columns);	
	},
	
	_onUserStoryModelRetrieved: function(model) {
	
		//console.log('Loaded Story grid with: ' + this.down('#monthlyPatchCombobox').getValue());
	
		var columns = [
			'FormattedID',
			'Name',
			'ScheduleState',
			'Project',
			'Owner',
			'Iteration',
			'Tags'
		];
		
		this._createGrid(model, 'storyGrid', 'Maintenance', columns);
	},
	
	_onFeatureModelRetrieved: function(model) {
		
		//console.log('Loaded Feature grid with: ' + this.down('#monthlyPatchCombobox').getValue());
		
		var columns = [
				'FormattedID',
				'Name',
				'Project',
				'Owner',
				'PercentDoneByStoryCount',
				'Tags'
			];
		
		this._createGrid(model, 'featureGrid', 'Enhancements', columns);
		//this.featureGrid.getStore().on('load', this._setPanelTitle(featurePanel, this.featureGrid.getStore()));
	},
	
	_createGrid: function(model, gridName, gridTitle, columns) {
		var panelId = gridName + 'Panel';

		var panel = this.down('#grid').add(
			Ext.create('Ext.panel.Panel', {
				bodyPadding: 5,
				margin: '10 0 0 20',
				itemId: panelId,
				title: gridTitle,
				collapsible: true,
				renderTo: Ext.getBody()
			})
		);
		
		var grid = this.down('#' + panelId).add({
			xtype: 'rallygrid',
			itemId: gridName,
			model: model,
			columnCfgs: columns,
			storeConfig: {
				//context: this.context.getDataContext(),
				context: {
					workspace: 'https://rally1.rallydev.com/slm/webservice/v2.0/workspace/1089940337',
					project: 'https://rally1.rallydev.com/slm/webservice/v2.0/project/1089940415',
					projectScopeUp: false,
					projectScopeDown: true
				},
				filters: [
					{
						property: 'Tags.Name',
						operator: '=',
						value: this.down('#monthlyPatchCombobox').getValue()
					}
				]
			}/*,
			viewConfig: {
				getRowClass: function(record) {
					if (record && record.get('Tags').indexOf('Hotfix') !== -1) {
						console.log('different color');
					} 
					else { 
						console.log('same color');
					}
				}
			}*/
		});
		
	},
	
	_getFilter: function() {
		var filterConfig = {
			property: 'Tags.Name',
			operator: '=',
			value: this.down('#monthlyPatchCombobox').getValue()
		};
		
		return filterConfig;
	},
	
	_setPanelTitle: function(panel, store) {
		panel.setTitle(panel.title + ' (' + store.getTotalCount() + ')');
	}
	
});
