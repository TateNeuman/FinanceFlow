export type Transaction = { id: string; user_id?: string; title: string; category: string; amount: number; type: 'income'|'expense'; date: string; created_at?: string }
export const categories = ['Food & Drinks','Shopping','Transport','Entertainment','Bills & Utilities','Health','Housing','Other']
export const incomeCategories = ['Salary','Freelance','Investments','Gifts','Other']
export const demoTransactions: Transaction[] = [
  {id:'1',title:'Monthly paycheck',category:'Salary',amount:4200,type:'income',date:'2026-10-01'},
  {id:'2',title:'Apartment rent',category:'Housing',amount:1250,type:'expense',date:'2026-10-02'},
  {id:'3',title:'Whole Foods Market',category:'Food & Drinks',amount:126.45,type:'expense',date:'2026-10-03'},
  {id:'4',title:'Freelance website',category:'Freelance',amount:680,type:'income',date:'2026-10-04'},
  {id:'5',title:'Spotify Premium',category:'Entertainment',amount:11.99,type:'expense',date:'2026-10-05'},
  {id:'6',title:'Gas station',category:'Transport',amount:52.8,type:'expense',date:'2026-10-06'},
  {id:'7',title:'Nike store',category:'Shopping',amount:94.5,type:'expense',date:'2026-10-07'},
  {id:'8',title:'Electric bill',category:'Bills & Utilities',amount:87.2,type:'expense',date:'2026-09-26'},
  {id:'9',title:'September paycheck',category:'Salary',amount:4200,type:'income',date:'2026-09-01'},
  {id:'10',title:'Dinner out',category:'Food & Drinks',amount:64.2,type:'expense',date:'2026-09-19'},
  {id:'11',title:'Gym membership',category:'Health',amount:35,type:'expense',date:'2026-08-12'},
  {id:'12',title:'August paycheck',category:'Salary',amount:4100,type:'income',date:'2026-08-01'}
]
export const money = (n:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n)
export const dateLabel = (date:string) => new Date(date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
export const monthKey = (date:string) => date.slice(0,7)
export const currentMonth = () => new Date().toLocaleDateString('en-CA',{year:'numeric',month:'2-digit'}).slice(0,7)
