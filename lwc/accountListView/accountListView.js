import { LightningElement,track,wire } from 'lwc';
import getAccountList from '@salesforce/apex/AccountHelper.getAccountList';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
export default class AccountListView extends LightningElement {

    @track columns = [{
        label: 'Account name',
        fieldName: 'nameUrl',
        type: 'url',
        typeAttributes: {label: { fieldName: 'Name' }, 
            target: '_blank'},
        sortable: true,
        editable: true
    },
    {
        label: 'Account Owner',
        fieldName: 'Owner',
        type: 'text',
        sortable: true,
        editable: true
    },
    {
        label: 'Phone',
        fieldName: 'Phone',
        type: 'phone',
        sortable: true,
        editable: true
    },
    {
        label: 'Website',
        fieldName: 'Website',
        type: 'url',
        sortable: true,
        editable: true
    },
    {
        label: 'Annual Revenue',
        fieldName: 'AnnualRevenue',
        type: 'Currency',
        sortable: true,
        editable: true
    }
];

@track error;
    @track accList ;
    @track accFinalList ;
    @track saveDraftValues = [];
    defaultSortDirection = 'asc';
    sortDirection = 'asc';
    sortedBy;
    @wire(getAccountList)
    wiredAccounts({
        error,
        data
    }) {
        if (data) {
            let nameUrl;
            this.accList = data.map(row => { 
                nameUrl = `/${row.Id}`;
                return {...row , nameUrl, Owner:row.Owner.Name} 
            });
            this.accFinalList = [...this.accList];
        } else if (error) {
            this.error = error;
        }
    }

    handleSave(event) {
        this.saveDraftValues = event.detail.draftValues;
        const recordInputs = this.saveDraftValues.slice().map(draft => {
            const fields = Object.assign({}, draft);
            return { fields };
        });
        const promises = recordInputs.map(recordInput => updateRecord(recordInput));
        Promise.all(promises).then(res => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Records Updated Successfully!!',
                    variant: 'success'
                })
            );
            this.saveDraftValues = [];
            return this.refresh();
        }).catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'An Error Occured!!',
                    variant: 'error'
                })
            );
        }).finally(() => {
            this.saveDraftValues = [];
        });
    }

    // This function is used to refresh the table once data updated
    async refresh() {
        await refreshApex(this.accList);
    }

    doSorting(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }

    sortData(fieldname, direction) {
        let parseData = JSON.parse(JSON.stringify(this.accList));
        // Return the value stored in the field
        let keyValue = (a) => {
            return a[fieldname];
        };
        // cheking reverse direction
        let isReverse = direction === 'asc' ? 1: -1;
        // sorting data
        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : ''; // handling null values
            y = keyValue(y) ? keyValue(y) : '';
            // sorting values based on direction
            return isReverse * ((x > y) - (y > x));
        });
        this.accList = parseData;
    }
    
    handleSearchAccount(event){
        const inputValue = event.target.value[0];
        const regex = new RegExp(`^${inputValue}`, 'i'); 
        this.accList = this.accList.filter(row => regex.test(row.Name));
        if (!event.target.value) {
            this.accList = [...this.accFinalList];
        }
    }
}