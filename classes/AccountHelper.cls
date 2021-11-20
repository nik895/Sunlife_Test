public with sharing class AccountHelper {
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccountList() {
        return [SELECT Id, Name,Owner.Name,
                Phone, Website, AnnualRevenue, Industry
            FROM Account where Industry = 'Financial Services'];
    }
}