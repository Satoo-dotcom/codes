'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Copy, RefreshCw, Eye, EyeOff, Plus, Trash2, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

type Account = {
  id: string;
  name: string;
  email: string;
  username: string;
  password: string;
  group: string;
}

export default function AdvancedGenerator() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({})
  const [passwordLength, setPasswordLength] = useState(12)
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null)
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false)
  const [numberOfAccounts, setNumberOfAccounts] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [groupFilter, setGroupFilter] = useState<string>('All')

  const generateEmail = () => {
    const domain = 'gmail.com'
    const randomString = Math.random().toString(36).substring(2, 10)
    return `${randomString}@${domain}`
  }

  const generateUsername = () => {
    const words = [
      'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'black', 'white',
      'cat', 'dog', 'bird', 'fish', 'lion', 'tiger', 'bear', 'wolf', 'fox',
      'sun', 'moon', 'star', 'cloud', 'rain', 'snow', 'wind', 'storm',
      'tree', 'flower', 'river', 'mountain', 'ocean', 'forest', 'desert',
      'happy', 'sad', 'angry', 'excited', 'calm', 'brave', 'shy', 'clever',
      'swift', 'strong', 'gentle', 'wild', 'quiet', 'loud', 'bright', 'dark'
    ]
    const getRandomWord = () => words[Math.floor(Math.random() * words.length)]
    const randomNumber = Math.floor(Math.random() * 1000)
    return `${getRandomWord()}${getRandomWord()}${randomNumber}`
  }

  const generatePassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let newPassword = ''
    for (let i = 0; i < passwordLength; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return newPassword
  }

  const addAccounts = () => {
    const newAccounts = Array.from({ length: numberOfAccounts }, (_, index) => ({
      id: Date.now().toString() + index,
      name: `Account ${accounts.length + index + 1}`,
      email: generateEmail(),
      username: generateUsername(),
      password: generatePassword(),
      group: 'General'
    }))
    setAccounts(prevAccounts => {
      const updatedAccounts = [...prevAccounts, ...newAccounts];
      saveAccounts(updatedAccounts);
      return updatedAccounts;
    })
    setShowPasswords(prevState => {
      const newState = { ...prevState }
      newAccounts.forEach(account => {
        newState[account.id] = false
      })
      return newState
    })
  }

  const updateAccount = (id: string, field: keyof Account, value: string) => {
    setAccounts(prevAccounts => {
      const updatedAccounts = prevAccounts.map(account => 
        account.id === id ? {...account, [field]: value} : account
      );
      saveAccounts(updatedAccounts);
      return updatedAccounts;
    });
  }

  const deleteAccount = (id: string) => {
    setAccounts(prevAccounts => {
      const updatedAccounts = prevAccounts.filter(account => account.id !== id);
      saveAccounts(updatedAccounts);
      return updatedAccounts;
    });
    setAccountToDelete(null)
  }

  const deleteAllAccounts = () => {
    setAccounts([]);
    saveAccounts([]);
    setShowDeleteAllDialog(false)
  }

  const regenerateAllAccounts = () => {
    setAccounts(prevAccounts => {
      const updatedAccounts = prevAccounts.map(account => ({
        ...account,
        email: generateEmail(),
        username: generateUsername(),
        password: generatePassword()
      }));
      saveAccounts(updatedAccounts);
      return updatedAccounts;
    });
    setShowRegenerateDialog(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords({...showPasswords, [id]: !showPasswords[id]})
  }

  const exportAccounts = (format: 'json' | 'pdf' | 'xlsx') => {
    switch (format) {
      case 'json':
        const jsonString = JSON.stringify(accounts, null, 2)
        const jsonBlob = new Blob([jsonString], { type: 'application/json' })
        const jsonUrl = URL.createObjectURL(jsonBlob)
        const jsonLink = document.createElement('a')
        jsonLink.href = jsonUrl
        jsonLink.download = 'disposable_accounts.json'
        jsonLink.click()
        break
      case 'pdf':
        const pdf = new jsPDF()
        pdf.autoTable({
          head: [['Name', 'Email', 'Username', 'Password', 'Group']],
          body: accounts.map(account => [account.name, account.email, account.username, account.password, account.group])
        })
        pdf.save('disposable_accounts.pdf')
        break
      case 'xlsx':
        const worksheet = XLSX.utils.json_to_sheet(accounts)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Accounts')
        XLSX.writeFile(workbook, 'disposable_accounts.xlsx')
        break
    }
  }

  const filteredAccounts = accounts.filter(account =>
    (groupFilter === 'All' || account.group === groupFilter) &&
    (account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
     account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
     account.group.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  useEffect(() => {
    const savedAccounts = loadAccounts();
    setAccounts(savedAccounts);
    setShowPasswords(savedAccounts.reduce((acc, account) => {
      acc[account.id] = false;
      return acc;
    }, {}));
  }, []);

  const saveAccounts = (accounts: Account[]) => {
    try {
      localStorage.setItem('disposableAccounts', JSON.stringify(accounts));
    } catch (error) {
      console.error('Error saving accounts:', error);
    }
  }

  const loadAccounts = (): Account[] => {
    try {
      const savedAccounts = localStorage.getItem('disposableAccounts');
      return savedAccounts ? JSON.parse(savedAccounts) : [];
    } catch (error) {
      console.error('Error loading accounts:', error);
      return [];
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">Account Generator</CardTitle>
          <CardDescription>Create and manage multiple disposable accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="w-full sm:w-1/3 space-y-2">
              <Label htmlFor="passwordLength">Password Length: {passwordLength}</Label>
              <Slider
                id="passwordLength"
                min={8}
                max={24}
                step={1}
                value={[passwordLength]}
                onValueChange={(value) => setPasswordLength(value[0])}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-1/3 space-y-2">
              <Label htmlFor="numberOfAccounts">Number of Accounts: {numberOfAccounts}</Label>
              <Slider
                id="numberOfAccounts"
                min={1}
                max={10}
                step={1}
                value={[numberOfAccounts]}
                onValueChange={(value) => setNumberOfAccounts(value[0])}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-1/3 space-y-2">
              <Label htmlFor="groupFilter">Filter by Group</Label>
              <Select onValueChange={(value) => setGroupFilter(value)} defaultValue="All">
                <SelectTrigger id="groupFilter">
                  <SelectValue placeholder="Filter by group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Groups</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Social Media">Social Media</SelectItem>
                  <SelectItem value="Shopping">Shopping</SelectItem>
                  <SelectItem value="Forums">Forums</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addAccounts} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Accounts
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="w-full sm:w-2/3">
              <Input
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex space-x-2 w-full sm:w-auto">
              <Select onValueChange={(value) => exportAccounts(value as 'json' | 'pdf' | 'xlsx')}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">Export as JSON</SelectItem>
                  <SelectItem value="pdf">Export as PDF</SelectItem>
                  <SelectItem value="xlsx">Export as XLSX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {filteredAccounts.map(account => (
            <Card key={account.id} className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`name-${account.id}`}>Account Name</Label>
                  <Input
                    id={`name-${account.id}`}
                    value={account.name}
                    onChange={(e) => updateAccount(account.id, 'name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`group-${account.id}`}>Group</Label>
                  <Select
                    onValueChange={(value) => updateAccount(account.id, 'group', value)}
                    defaultValue={account.group}
                  >
                    <SelectTrigger id={`group-${account.id}`}>
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Social Media">Social Media</SelectItem>
                      <SelectItem value="Shopping">Shopping</SelectItem>
                      <SelectItem value="Forums">Forums</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`email-${account.id}`}>Email</Label>
                  <div className="flex space-x-2">
                    <Input id={`email-${account.id}`} value={account.email} readOnly className="flex-grow" />
                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(account.email)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => updateAccount(account.id, 'email', generateEmail())}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`username-${account.id}`}>Username</Label>
                  <div className="flex space-x-2">
                    <Input id={`username-${account.id}`} value={account.username} readOnly className="flex-grow" />
                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(account.username)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => updateAccount(account.id, 'username', generateUsername())}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`password-${account.id}`}>Password</Label>
                  <div className="flex space-x-2">
                    <div className="relative flex-grow">
                      <Input 
                        id={`password-${account.id}`} 
                        type={showPasswords[account.id] ? "text" : "password"} 
                        value={account.password} 
                        readOnly 
                        className="pr-10"
                      />
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="absolute right-0 top-0 h-full"
                        onClick={() => togglePasswordVisibility(account.id)}
                      >
                        {showPasswords[account.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(account.password)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => updateAccount(account.id, 'password', generatePassword())}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <Dialog open={accountToDelete === account.id} onOpenChange={(open) => !open && setAccountToDelete(null)}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="mt-4" onClick={() => setAccountToDelete(account.id)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you sure you want to delete this account?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete the account.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAccountToDelete(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={() => deleteAccount(account.id)}>Delete</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </Card>
          ))}
        </CardContent>
        <CardFooter className="flex flex-col  space-y-2">
          <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
            <DialogTrigger asChild>
              <Button className="w-full">Regenerate All Accounts</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Regenerate All Accounts</DialogTitle>
                <DialogDescription>
                  Are you sure you want to regenerate all account details? This action will create new email addresses, usernames, and passwords for all accounts.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRegenerateDialog(false)}>Cancel</Button>
                <Button onClick={regenerateAllAccounts}>Regenerate</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" /> Delete All Accounts
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete All Accounts</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete all accounts? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteAllDialog(false)}>Cancel</Button>
                <Button variant="destructive" onClick={deleteAllAccounts}>Delete All</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  )
}