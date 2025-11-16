#!/bin/bash

# Fix all implicit 'any' types in API routes and app pages

echo "Fixing all TypeScript implicit 'any' types..."

# app/api/chefs/[slug]/analytics/route.ts
sed -i '' 's/.reduce((sum, day) => sum + (day.rating \|\| 0), 0)/.reduce((sum: number, day: any) => sum + (day.rating || 0), 0)/g' 'app/api/chefs/[slug]/analytics/route.ts'

# app/api/customer/insights/route.ts
sed -i '' 's/orders.forEach((order) => {/orders.forEach((order: any) => {/g' 'app/api/customer/insights/route.ts'
sed -i '' 's/order.items.forEach((item: any)/order.items.forEach((item: any)/g' 'app/api/customer/insights/route.ts'

# app/api/chefs/route.ts
sed -i '' 's/chefs.map((chef) => ({/chefs.map((chef: any) => ({/g' 'app/api/chefs/route.ts'

# app/api/orders/[id]/route.ts
sed -i '' 's/order.items.map((item) => ({/order.items.map((item: any) => ({/g' 'app/api/orders/[id]/route.ts'

# app/api/orders/pending-queue/route.ts
sed -i '' 's/.reduce((a, b) => a + b, 0)/.reduce((a: number, b: number) => a + b, 0)/g' 'app/api/orders/pending-queue/route.ts'

# app/api/orders/modify/route.ts
sed -i '' 's/.reduce((sum, item) => sum + (item.quantity \* item.price), 0)/.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0)/g' 'app/api/orders/modify/route.ts'

# app/api/payments/financials/route.ts
sed -i '' 's/.reduce((sum, p) => sum + p.netAmount + (p.tip \|\| 0), 0)/.reduce((sum: number, p: any) => sum + p.netAmount + (p.tip || 0), 0)/g' 'app/api/payments/financials/route.ts'
sed -i '' 's/.reduce((sum, p) => sum + p.gatewayFee, 0)/.reduce((sum: number, p: any) => sum + p.gatewayFee, 0)/g' 'app/api/payments/financials/route.ts'
sed -i '' 's/.reduce((sum, p) => sum + p.amount + (p.tip \|\| 0), 0)/.reduce((sum: number, p: any) => sum + p.amount + (p.tip || 0), 0)/g' 'app/api/payments/financials/route.ts'
sed -i '' 's/.reduce((sum, o) => sum + o.total, 0)/.reduce((sum: number, o: any) => sum + o.total, 0)/g' 'app/api/payments/financials/route.ts'
sed -i '' 's/.reduce((acc, p) => {/.reduce((acc: any, p: any) => {/g' 'app/api/payments/financials/route.ts'
sed -i '' 's/.reduce((sum, p) => sum + p.netAmount, 0)/.reduce((sum: number, p: any) => sum + p.netAmount, 0)/g' 'app/api/payments/financials/route.ts'

# app/api/forecast/demand/route.ts
sed -i '' 's/.reduce((max, pred) =>/.reduce((max: any, pred: any) =>/g' 'app/api/forecast/demand/route.ts'
sed -i '' 's/.reduce((sum, p) => sum + p.predictedOrders, 0)/.reduce((sum: number, p: any) => sum + p.predictedOrders, 0)/g' 'app/api/forecast/demand/route.ts'

# app/api/chat/route.ts
sed -i '' 's/addToCartActions.reduce((sum, action) =>/addToCartActions.reduce((sum: number, action: any) =>/g' 'app/api/chat/route.ts'

# app/api/payouts/route.ts
sed -i '' 's/payouts.reduce((sum, p) => sum + p.netEarnings, 0)/payouts.reduce((sum: number, p: any) => sum + p.netEarnings, 0)/g' 'app/api/payouts/route.ts'

# app/api/analytics/route.ts
sed -i '' 's/.reduce((sum, count) => sum + count, 0)/.reduce((sum: number, count: number) => sum + count, 0)/g' 'app/api/analytics/route.ts'
sed -i '' 's/.reduce((sum, conv) => sum + conv.amount, 0)/.reduce((sum: number, conv: any) => sum + conv.amount, 0)/g' 'app/api/analytics/route.ts'
sed -i '' 's/.reduce((acc, event) => {/.reduce((acc: any, event: any) => {/g' 'app/api/analytics/route.ts'

echo "Done! All types fixed."

