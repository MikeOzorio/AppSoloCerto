-- Corrigir Políticas de RLS (Permissões de Leitura)

ALTER TABLE public.analysis_parameter_ranges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analysis_parameter_ranges_select_global_or_own" ON public.analysis_parameter_ranges;
CREATE POLICY "analysis_parameter_ranges_select_global_or_own" ON public.analysis_parameter_ranges
FOR SELECT USING (owner_id IS NULL OR owner_id = auth.uid());

ALTER TABLE public.nutrient_classifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nutrient_classifications_select_global_or_own" ON public.nutrient_classifications;
CREATE POLICY "nutrient_classifications_select_global_or_own" ON public.nutrient_classifications
FOR SELECT USING (owner_id IS NULL OR owner_id = auth.uid());

ALTER TABLE public.analysis_parameters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analysis_parameters_select_global_or_own" ON public.analysis_parameters;
CREATE POLICY "analysis_parameters_select_global_or_own" ON public.analysis_parameters
FOR SELECT USING (owner_id IS NULL OR owner_id = auth.uid());
