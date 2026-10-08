import React, { useState } from 'react';
import { ArrowRight, Building2, UserCircle2 } from 'lucide-react';
import Card from './common/Card';
import BrandMark from './common/BrandMark';
import { corporateDepartments, customerCategories } from '../data/navigation';

function AuthGate({ onSignIn }) {
  const [personaType, setPersonaType] = useState('customer');
  const [category, setCategory] = useState(customerCategories[0]);
  const [department, setDepartment] = useState(corporateDepartments[0]);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSignIn({
      personaType,
      category: personaType === 'customer' ? category : department,
      userId: userId || (personaType === 'customer' ? 'CUST001256' : 'EMP00781'),
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <Card className="w-full max-w-2xl p-6 text-center sm:p-8">
        <div className="mx-auto flex justify-center">
          <BrandMark compact={false} />
        </div>

        <h2 className="mt-8 text-2xl font-semibold text-slate-900">Sign in to continue</h2>
        <p className="mt-1 text-sm text-slate-500">Choose a persona to access the relevant workspace.</p>

        <form onSubmit={handleSubmit} className="mx-auto mt-6 max-w-xl space-y-5 text-left">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPersonaType('customer')}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  personaType === 'customer' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="font-medium text-slate-900">Customer</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">Industrial &amp; commercial customers</p>
              </button>
              <button
                type="button"
                onClick={() => setPersonaType('corporate')}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  personaType === 'corporate' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  <span className="font-medium text-slate-900">Employee</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">Internal department teams</p>
              </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-medium text-slate-700">
              {personaType === 'customer' ? 'Select Customer Category' : 'Select Department'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(personaType === 'customer' ? customerCategories : corporateDepartments).map((option) => {
                const active = personaType === 'customer' ? category === option : department === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => (personaType === 'customer' ? setCategory(option) : setDepartment(option))}
                    className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                      active ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-slate-600">{personaType === 'customer' ? 'Customer ID' : 'Employee ID'}</span>
              <input
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                placeholder={personaType === 'customer' ? 'CUST001256' : 'EMP00781'}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter secure password"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </label>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            Sign In
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </Card>
    </div>
  );
}

export default AuthGate;
