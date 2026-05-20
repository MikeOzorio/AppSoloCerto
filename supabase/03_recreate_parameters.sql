-- Limpeza Total de Parâmetros e Classificações
TRUNCATE TABLE public.analysis_parameter_ranges CASCADE;
TRUNCATE TABLE public.analysis_parameters CASCADE;
TRUNCATE TABLE public.nutrient_classifications CASCADE;

DO $$
DECLARE
  c_baixo uuid;
  c_medio uuid;
  c_adequado uuid;
  c_muito_alto uuid;
  c_muito_baixo uuid;
  c_alto uuid;
  c_neutro uuid;
  c_alcalino uuid;
  p_id uuid;
BEGIN

  INSERT INTO public.nutrient_classifications (owner_id, name, color, sort_order) VALUES (null, 'Muito baixo', '#ef4444', 10) RETURNING id INTO c_muito_baixo;
  INSERT INTO public.nutrient_classifications (owner_id, name, color, sort_order) VALUES (null, 'Baixo', '#f97316', 20) RETURNING id INTO c_baixo;
  INSERT INTO public.nutrient_classifications (owner_id, name, color, sort_order) VALUES (null, 'Médio', '#eab308', 30) RETURNING id INTO c_medio;
  INSERT INTO public.nutrient_classifications (owner_id, name, color, sort_order) VALUES (null, 'Adequado', '#22c55e', 40) RETURNING id INTO c_adequado;
  INSERT INTO public.nutrient_classifications (owner_id, name, color, sort_order) VALUES (null, 'Alto', '#3b82f6', 50) RETURNING id INTO c_alto;
  INSERT INTO public.nutrient_classifications (owner_id, name, color, sort_order) VALUES (null, 'Muito alto', '#8b5cf6', 60) RETURNING id INTO c_muito_alto;
  INSERT INTO public.nutrient_classifications (owner_id, name, color, sort_order) VALUES (null, 'Neutro', '#6b7280', 70) RETURNING id INTO c_neutro;
  INSERT INTO public.nutrient_classifications (owner_id, name, color, sort_order) VALUES (null, 'Alcalino', '#8b5cf6', 80) RETURNING id INTO c_alcalino;

  INSERT INTO public.analysis_parameters (owner_id, param_key, symbol, name, parameter_group, unit, active) 
  VALUES (null, 'ph_agua', 'pH', 'pH (água)', 'quimicos', '', true) RETURNING id INTO p_id;
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_baixo, 'lt', null, 5, 10);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_medio, 'between', 5, 5.5, 20);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_adequado, 'between', 5.5, 6.5, 30);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_muito_alto, 'gt', 6.5, null, 40);

  INSERT INTO public.analysis_parameters (owner_id, param_key, symbol, name, parameter_group, unit, active) 
  VALUES (null, 'mo', 'MO', 'Matéria Orgânica', 'quimicos', 'dag/kg', true) RETURNING id INTO p_id;
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_baixo, 'lt', null, 1.5, 10);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_medio, 'between', 1.5, 3, 20);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_adequado, 'between', 3, 6, 30);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_muito_alto, 'gt', 6, null, 40);

  INSERT INTO public.analysis_parameters (owner_id, param_key, symbol, name, parameter_group, unit, active) 
  VALUES (null, 'p_mehlich', 'P', 'Fósforo Mehlich-1', 'macro', 'mg/dm³', true) RETURNING id INTO p_id;
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_baixo, 'lt', null, 10, 10);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_medio, 'between', 10, 20, 20);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_adequado, 'between', 20, 40, 30);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_muito_alto, 'gt', 40, null, 40);

  INSERT INTO public.analysis_parameters (owner_id, param_key, symbol, name, parameter_group, unit, active) 
  VALUES (null, 'p_resina', 'P', 'Fósforo Resina', 'macro', 'mg/dm³', true) RETURNING id INTO p_id;
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_baixo, 'lt', null, 15, 10);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_medio, 'between', 15, 30, 20);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_adequado, 'between', 30, 60, 30);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_muito_alto, 'gt', 60, null, 40);

  INSERT INTO public.analysis_parameters (owner_id, param_key, symbol, name, parameter_group, unit, active) 
  VALUES (null, 'k', 'K', 'Potássio', 'macro', 'mmolc/dm³', true) RETURNING id INTO p_id;
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_baixo, 'lt', null, 1.5, 10);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_medio, 'between', 1.5, 3, 20);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_adequado, 'between', 3, 4.5, 30);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_muito_alto, 'gt', 4.5, null, 40);

  INSERT INTO public.analysis_parameters (owner_id, param_key, symbol, name, parameter_group, unit, active) 
  VALUES (null, 'ca', 'Ca', 'Cálcio', 'macro', 'mmolc/dm³', true) RETURNING id INTO p_id;
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_baixo, 'lt', null, 15, 10);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_medio, 'between', 15, 25, 20);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_adequado, 'between', 25, 40, 30);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_muito_alto, 'gt', 40, null, 40);

  INSERT INTO public.analysis_parameters (owner_id, param_key, symbol, name, parameter_group, unit, active) 
  VALUES (null, 'mg', 'Mg', 'Magnésio', 'macro', 'mmolc/dm³', true) RETURNING id INTO p_id;
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_baixo, 'lt', null, 5, 10);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_medio, 'between', 5, 8, 20);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_adequado, 'between', 8, 15, 30);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_muito_alto, 'gt', 15, null, 40);

  INSERT INTO public.analysis_parameters (owner_id, param_key, symbol, name, parameter_group, unit, active) 
  VALUES (null, 's', 'S', 'Enxofre', 'macro', 'mg/dm³', true) RETURNING id INTO p_id;
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_baixo, 'lt', null, 5, 10);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_medio, 'between', 5, 10, 20);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_adequado, 'between', 10, 20, 30);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_muito_alto, 'gt', 20, null, 40);

  INSERT INTO public.analysis_parameters (owner_id, param_key, symbol, name, parameter_group, unit, active) 
  VALUES (null, 'al', 'Al', 'Alumínio', 'indices', 'cmolc/dm³', true) RETURNING id INTO p_id;
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_baixo, 'lt', null, 0.3, 10);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_medio, 'between', 0.3, 0.5, 20);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_adequado, 'between', 0.5, 1, 30);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_muito_alto, 'gt', 1, null, 40);

  INSERT INTO public.analysis_parameters (owner_id, param_key, symbol, name, parameter_group, unit, active) 
  VALUES (null, 'h_al', 'H+Al', 'Acidez Potencial', 'indices', 'cmolc/dm³', true) RETURNING id INTO p_id;
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_baixo, 'lt', null, 2.5, 10);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_medio, 'between', 2.5, 5, 20);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_adequado, 'between', 5, 8, 30);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_muito_alto, 'gt', 8, null, 40);

  INSERT INTO public.analysis_parameters (owner_id, param_key, symbol, name, parameter_group, unit, active) 
  VALUES (null, 'b', 'B', 'Boro', 'micro', 'mg/dm³', true) RETURNING id INTO p_id;
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_baixo, 'lt', null, 0.2, 10);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_medio, 'between', 0.2, 0.4, 20);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_adequado, 'between', 0.4, 0.8, 30);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_muito_alto, 'gt', 0.8, null, 40);

  INSERT INTO public.analysis_parameters (owner_id, param_key, symbol, name, parameter_group, unit, active) 
  VALUES (null, 'cu', 'Cu', 'Cobre', 'micro', 'mg/dm³', true) RETURNING id INTO p_id;
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_baixo, 'lt', null, 0.8, 10);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_medio, 'between', 0.8, 1.5, 20);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_adequado, 'between', 1.5, 3, 30);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_muito_alto, 'gt', 3, null, 40);

  INSERT INTO public.analysis_parameters (owner_id, param_key, symbol, name, parameter_group, unit, active) 
  VALUES (null, 'fe', 'Fe', 'Ferro', 'micro', 'mg/dm³', true) RETURNING id INTO p_id;
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_baixo, 'lt', null, 20, 10);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_medio, 'between', 20, 40, 20);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_adequado, 'between', 40, 100, 30);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_muito_alto, 'gt', 100, null, 40);

  INSERT INTO public.analysis_parameters (owner_id, param_key, symbol, name, parameter_group, unit, active) 
  VALUES (null, 'mn', 'Mn', 'Manganês', 'micro', 'mg/dm³', true) RETURNING id INTO p_id;
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_baixo, 'lt', null, 5, 10);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_medio, 'between', 5, 15, 20);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_adequado, 'between', 15, 40, 30);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_muito_alto, 'gt', 40, null, 40);

  INSERT INTO public.analysis_parameters (owner_id, param_key, symbol, name, parameter_group, unit, active) 
  VALUES (null, 'zn', 'Zn', 'Zinco', 'micro', 'mg/dm³', true) RETURNING id INTO p_id;
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_baixo, 'lt', null, 1, 10);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_medio, 'between', 1, 2.5, 20);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_adequado, 'between', 2.5, 5, 30);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_muito_alto, 'gt', 5, null, 40);

  INSERT INTO public.analysis_parameters (owner_id, param_key, symbol, name, parameter_group, unit, active) 
  VALUES (null, 'sb', 'SB', 'Soma de Bases', 'indices', 'cmolc/dm³', true) RETURNING id INTO p_id;
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_baixo, 'lt', null, 2, 10);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_medio, 'between', 2, 4, 20);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_adequado, 'between', 4, 8, 30);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_muito_alto, 'gt', 8, null, 40);

  INSERT INTO public.analysis_parameters (owner_id, param_key, symbol, name, parameter_group, unit, active) 
  VALUES (null, 't', 't', 'CTC Efetiva', 'indices', 'cmolc/dm³', true) RETURNING id INTO p_id;
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_baixo, 'lt', null, 2.5, 10);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_medio, 'between', 2.5, 5, 20);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_adequado, 'between', 5, 10, 30);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_muito_alto, 'gt', 10, null, 40);

  INSERT INTO public.analysis_parameters (owner_id, param_key, symbol, name, parameter_group, unit, active) 
  VALUES (null, 'ctc', 'T', 'CTC a pH 7', 'indices', 'cmolc/dm³', true) RETURNING id INTO p_id;
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_baixo, 'lt', null, 5, 10);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_medio, 'between', 5, 8, 20);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_adequado, 'between', 8, 15, 30);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_muito_alto, 'gt', 15, null, 40);

  INSERT INTO public.analysis_parameters (owner_id, param_key, symbol, name, parameter_group, unit, active) 
  VALUES (null, 'v', 'V%', 'Saturação por Bases', 'indices', '%', true) RETURNING id INTO p_id;
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_baixo, 'lt', null, 40, 10);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_medio, 'between', 40, 60, 20);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_adequado, 'between', 60, 80, 30);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_muito_alto, 'gt', 80, null, 40);

  INSERT INTO public.analysis_parameters (owner_id, param_key, symbol, name, parameter_group, unit, active) 
  VALUES (null, 'm', 'm%', 'Saturação por Al', 'indices', '%', true) RETURNING id INTO p_id;
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_baixo, 'lt', null, 10, 10);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_medio, 'between', 10, 20, 20);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_adequado, 'between', 20, 40, 30);
  INSERT INTO public.analysis_parameter_ranges (owner_id, parameter_id, classification_id, comparison_type, value_from, value_to, sort_order)
  VALUES (null, p_id, c_muito_alto, 'gt', 40, null, 40);

END $$;
