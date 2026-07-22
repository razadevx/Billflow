"use client";

import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardContainer } from "@/components/layout/DashboardContainer";
import { PageHeader, PageSection } from "@/components/layout/PageLayout";
import { MetricCard } from "@/components/ui/MetricCard";
import { ActivityItem } from "@/components/ui/ActivityItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export default function DashboardPage() {
  const router = useRouter();

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: async () => {
      const res = await fetch("/api/v1/dashboard/kpis");
      if (!res.ok) throw new Error("Failed to load KPIs");
      return res.json().then(json => json.data);
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: todayWorkOrders, isLoading: woLoading } = useQuery({
    queryKey: ["dashboard", "workorders", "today"],
    queryFn: async () => {
      const res = await fetch("/api/v1/dashboard/workorders");
      if (!res.ok) throw new Error("Failed to load work orders");
      return res.json().then(json => json.data);
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: activityFeed, isLoading: activityLoading } = useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: async () => {
      const res = await fetch("/api/v1/dashboard/activity");
      if (!res.ok) throw new Error("Failed to load activity");
      return res.json().then(json => json.data);
    },
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 15 * 1000,
  });

  const { data: lowStockItems, isLoading: stockLoading } = useQuery({
    queryKey: ["dashboard", "inventory", "lowStock"],
    queryFn: async () => {
      const res = await fetch("/api/v1/dashboard/inventory");
      if (!res.ok) throw new Error("Failed to load low stock");
      return res.json().then(json => json.data);
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <DashboardContainer className="py-8 animate-fade-in">
      <PageHeader 
        title="Dashboard" 
        description="Good morning, here is your business overview."
        actions={
          <>
            <Button onClick={() => router.push("/workorders/new")} variant="default">
              <Icons.add className="mr-2" /> New Work Order
            </Button>
            <Button onClick={() => router.push("/payments/new")} variant="secondary">
              <Icons.dollar className="mr-2" /> Receive Payment
            </Button>
          </>
        }
      />

      {/* Hero KPIs */}
      <PageSection>
        {kpisLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-32 bg-muted rounded-xl"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <MetricCard 
              title="Revenue"
              value={formatCurrency(kpis?.totalRevenue || 0)}
              icon={Icons.dollar}
              accentColor="success"
              trend={0}
              trendLabel="vs last month"
              className="animate-slide-up"
              style={{ animationDelay: "100ms" }}
            />
            <MetricCard 
              title="Outstanding Balance"
              value={formatCurrency(kpis?.outstandingBalance || 0)}
              icon={Icons.wallet}
              accentColor="danger"
              className="animate-slide-up"
              style={{ animationDelay: "200ms" }}
            />
            <MetricCard 
              title="Active Work Orders"
              value={kpis?.activeWorkOrders?.toString() || "0"}
              icon={Icons.workOrder}
              accentColor="primary"
              className="animate-slide-up"
              style={{ animationDelay: "300ms" }}
            />
            <MetricCard 
              title="Low Stock Items"
              value={kpis?.lowStockItems?.toString() || "0"}
              icon={Icons.package}
              accentColor="warning"
              className="animate-slide-up"
              style={{ animationDelay: "400ms" }}
            />
            <MetricCard 
              title="Stock Valuation"
              value={formatCurrency(kpis?.stockValuation || 0)}
              icon={Icons.wallet}
              accentColor="success"
              className="animate-slide-up"
              style={{ animationDelay: "500ms" }}
            />
          </div>
        )}
      </PageSection>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Left Column (Wider) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Revenue Chart Placeholder */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-h3">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState 
                icon={Icons.chart} 
                title="No Revenue Data" 
                description="Complete a work order to see your revenue charts." 
                className="bg-transparent border-0 py-12"
              />
            </CardContent>
          </Card>

          {/* Today's Jobs */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-h3">Today's Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {woLoading ? (
                <div className="h-32 bg-muted rounded-xl animate-pulse"></div>
              ) : !todayWorkOrders?.length ? (
                <EmptyState 
                  icon={Icons.workOrder} 
                  title="No work orders yet" 
                  description="Create your first work order to start tracking jobs." 
                  action={<Button onClick={() => router.push("/workorders/new")}><Icons.add className="mr-2" /> Create Work Order</Button>}
                />
              ) : (
                <div className="space-y-4">
                  {todayWorkOrders.map((wo: any) => (
                    <div key={wo.id} className="flex justify-between items-center p-4 border rounded-xl hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="font-semibold">{wo.title}</p>
                        <p className="text-sm text-muted-foreground">{wo.customer.name} - #{wo.orderNumber}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/workorders/${wo.id}`)}>
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column (Narrower) */}
        <div className="space-y-6">
          
          {/* Recent Activity */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-h3">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {activityLoading ? (
                <div className="h-32 bg-muted rounded-xl animate-pulse"></div>
              ) : !activityFeed?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No recent activity.</p>
              ) : (
                activityFeed.map((activity: any, idx: number) => (
                  <React.Fragment key={activity.id}>
                    <ActivityItem 
                      user={activity.user?.name || "System"}
                      action={activity.action}
                      time={new Date(activity.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      status="info"
                    />
                    {idx < activityFeed.length - 1 && <div className="border-b border-border ml-6" />}
                  </React.Fragment>
                ))
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-h3">Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {stockLoading ? (
                <div className="h-32 bg-muted rounded-xl animate-pulse"></div>
              ) : !lowStockItems?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center flex items-center justify-center gap-2">
                  <Icons.check className="text-success h-4 w-4" /> Stock levels look good.
                </p>
              ) : (
                <div className="space-y-3">
                  {lowStockItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-xs text-danger bg-danger/10 px-2 py-1 rounded-full font-semibold">
                        {item.availableQuantity} {item.unit} left
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </DashboardContainer>
  );
}

