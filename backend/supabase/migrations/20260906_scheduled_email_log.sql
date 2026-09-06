CREATE TABLE IF NOT EXISTS public.scheduled_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(40) NOT NULL,
  report_date DATE NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  order_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT scheduled_email_log_unique_delivery UNIQUE (report_type, report_date, recipient)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_email_log_date ON public.scheduled_email_log(report_date);
ALTER TABLE public.scheduled_email_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.scheduled_email_log FROM anon;
REVOKE ALL ON TABLE public.scheduled_email_log FROM authenticated;
