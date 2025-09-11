<?php

declare(strict_types=1);

/*
 * PHP-CS-Fixer Configuration for PA-QA Framework
 * 
 * This configuration enforces PSR-12 coding standards with additional
 * rules for WordPress and Laravel compatibility.
 */

use PhpCsFixer\Config;
use PhpCsFixer\Finder;

$finder = Finder::create()
    ->in([
        __DIR__ . '/src',
        __DIR__ . '/app',
        __DIR__ . '/tests',
        __DIR__ . '/config',
        __DIR__ . '/database',
        __DIR__ . '/routes',
    ])
    ->exclude([
        'vendor',
        'node_modules',
        'storage',
        'bootstrap/cache',
        'public',
        'build',
        'dist',
    ])
    ->ignoreDotFiles(true)
    ->ignoreVCS(true)
    ->name('*.php')
    ->notName('*.blade.php')
    ->notPath('database/migrations/*')
    ->notPath('lang/*');

$config = new Config();

return $config
    ->setRiskyAllowed(true)
    ->setRules([
        // PSR Standards
        '@PSR1' => true,
        '@PSR2' => true,
        '@PSR12' => true,
        '@PSR12:risky' => true,

        // Symfony Standards
        '@Symfony' => true,
        '@Symfony:risky' => true,

        // PhpCsFixer Standards
        '@PhpCsFixer' => true,
        '@PhpCsFixer:risky' => true,

        // Array notation
        'array_syntax' => ['syntax' => 'short'],
        'array_indentation' => true,
        'normalize_index_brace' => true,
        'no_multiline_whitespace_around_double_arrow' => true,
        'no_trailing_comma_in_singleline_array' => true,
        'no_whitespace_before_comma_in_array' => true,
        'trailing_comma_in_multiline' => ['elements' => ['arrays', 'arguments', 'parameters']],
        'trim_array_spaces' => true,
        'whitespace_after_comma_in_array' => true,

        // Basic fixes
        'encoding' => true,
        'full_opening_tag' => true,
        'no_closing_tag' => true,
        'no_trailing_whitespace' => true,
        'no_trailing_whitespace_in_comment' => true,
        'single_blank_line_at_eof' => true,

        // Braces and indentation
        'braces' => [
            'allow_single_line_closure' => true,
            'position_after_anonymous_constructs' => 'same',
            'position_after_control_structures' => 'same',
            'position_after_functions_and_oop_constructs' => 'next',
        ],
        'indentation_type' => true,
        'line_ending' => true,
        'no_break_comment' => true,
        'no_spaces_around_offset' => ['positions' => ['inside', 'outside']],

        // Casing
        'constant_case' => ['case' => 'lower'],
        'lowercase_keywords' => true,
        'lowercase_static_reference' => true,
        'magic_constant_casing' => true,
        'magic_method_casing' => true,
        'native_function_casing' => true,
        'native_function_type_declaration_casing' => true,

        // Cast notation
        'cast_spaces' => ['space' => 'single'],
        'lowercase_cast' => true,
        'modernize_types_casting' => true,
        'no_short_bool_cast' => true,
        'no_unset_cast' => true,
        'short_scalar_cast' => true,

        // Classes
        'class_attributes_separation' => [
            'elements' => [
                'const' => 'one',
                'method' => 'one',
                'property' => 'one',
                'trait_import' => 'none',
            ],
        ],
        'class_definition' => [
            'multi_line_extends_each_single_line' => true,
            'single_item_single_line' => true,
            'single_line' => true,
        ],
        'class_keyword_remove' => false,
        'final_class' => false,
        'final_internal_class' => false,
        'final_public_method_for_abstract_class' => false,
        'no_blank_lines_after_class_opening' => true,
        'no_null_property_initialization' => true,
        'no_php4_constructor' => true,
        'no_unneeded_final_method' => true,
        'ordered_class_elements' => [
            'order' => [
                'use_trait',
                'constant_public',
                'constant_protected',
                'constant_private',
                'property_public',
                'property_protected',
                'property_private',
                'construct',
                'destruct',
                'magic',
                'phpunit',
                'method_public',
                'method_protected',
                'method_private',
            ],
        ],
        'ordered_interfaces' => true,
        'phpdoc_order_by_value' => ['annotations' => ['covers']],
        'protected_to_private' => true,
        'self_accessor' => true,
        'self_static_accessor' => true,
        'single_class_element_per_statement' => ['elements' => ['const', 'property']],
        'visibility_required' => ['elements' => ['const', 'method', 'property']],

        // Comments
        'comment_to_phpdoc' => true,
        'header_comment' => false,
        'multiline_comment_opening_closing' => true,
        'no_empty_comment' => true,
        'no_trailing_whitespace_in_comment' => true,
        'single_line_comment_style' => ['comment_types' => ['hash']],

        // Control structures
        'elseif' => true,
        'no_alternative_syntax' => true,
        'no_break_comment' => true,
        'no_superfluous_elseif' => true,
        'no_trailing_comma_in_list_call' => true,
        'no_unneeded_control_parentheses' => [
            'statements' => ['break', 'clone', 'continue', 'echo_print', 'return', 'switch_case', 'yield'],
        ],
        'no_unneeded_curly_braces' => ['namespaces' => true],
        'no_useless_else' => true,
        'switch_case_semicolon_to_colon' => true,
        'switch_case_space' => true,
        'trailing_comma_in_multiline' => ['elements' => ['arrays', 'arguments', 'parameters']],
        'yoda_style' => ['equal' => false, 'identical' => false, 'less_and_greater' => false],

        // Doctrine annotation
        'doctrine_annotation_array_assignment' => ['operator' => '='],
        'doctrine_annotation_braces' => ['syntax' => 'without_braces'],
        'doctrine_annotation_indentation' => true,
        'doctrine_annotation_spaces' => ['around_parentheses' => true],

        // Function and method arguments
        'function_declaration' => ['closure_function_spacing' => 'one'],
        'function_typehint_space' => true,
        'lambda_not_used_import' => true,
        'method_argument_space' => ['on_multiline' => 'ensure_fully_multiline'],
        'no_spaces_after_function_name' => true,
        'return_type_declaration' => ['space_before' => 'none'],
        'single_line_throw' => false,
        'static_lambda' => true,

        // Imports
        'blank_line_after_namespace' => true,
        'clean_namespace' => true,
        'fully_qualified_strict_types' => true,
        'global_namespace_import' => ['import_classes' => false, 'import_constants' => false, 'import_functions' => false],
        'group_import' => true,
        'no_leading_import_slash' => true,
        'no_unused_imports' => true,
        'ordered_imports' => ['imports_order' => ['class', 'function', 'const'], 'sort_algorithm' => 'alpha'],
        'single_import_per_statement' => true,
        'single_line_after_imports' => true,

        // Language constructs
        'combine_consecutive_issets' => true,
        'combine_consecutive_unsets' => true,
        'declare_equal_normalize' => ['space' => 'none'],
        'declare_strict_types' => true,
        'dir_constant' => true,
        'error_suppression' => false,
        'function_to_constant' => ['functions' => ['get_called_class', 'get_class', 'get_class_this', 'php_sapi_name', 'phpversion', 'pi']],
        'include' => true,
        'is_null' => true,
        'logical_operators' => true,
        'modernize_types_casting' => true,
        'native_constant_invocation' => false,
        'native_function_invocation' => false,
        'no_alias_functions' => true,
        'no_homoglyph_names' => true,
        'no_php4_constructor' => true,
        'no_unset_on_property' => true,
        'pow_to_exponentiation' => true,
        'random_api_migration' => true,
        'set_type_to_cast' => true,
        'ternary_to_null_coalescing' => true,

        // Lists
        'list_syntax' => ['syntax' => 'short'],

        // Namespaces
        'blank_line_after_namespace' => true,
        'clean_namespace' => true,
        'no_leading_namespace_whitespace' => true,
        'single_blank_line_before_namespace' => true,

        // Operators
        'binary_operator_spaces' => ['default' => 'single_space'],
        'concat_space' => ['spacing' => 'one'],
        'increment_style' => ['style' => 'pre'],
        'new_with_braces' => true,
        'object_operator_without_whitespace' => true,
        'standardize_increment' => true,
        'standardize_not_equals' => true,
        'ternary_operator_spaces' => true,
        'unary_operator_spaces' => true,

        // PHP tag
        'blank_line_after_opening_tag' => true,
        'echo_tag_syntax' => ['format' => 'long'],
        'full_opening_tag' => true,
        'linebreak_after_opening_tag' => true,
        'no_closing_tag' => true,

        // PHPDoc
        'align_multiline_comment' => ['comment_type' => 'phpdocs_only'],
        'general_phpdoc_annotation_remove' => ['annotations' => ['author', 'package', 'subpackage']],
        'no_blank_lines_after_phpdoc' => true,
        'no_empty_phpdoc' => true,
        'no_superfluous_phpdoc_tags' => ['allow_mixed' => true, 'allow_unused_params' => true],
        'phpdoc_add_missing_param_annotation' => true,
        'phpdoc_align' => ['align' => 'vertical'],
        'phpdoc_annotation_without_dot' => true,
        'phpdoc_indent' => true,
        'phpdoc_inline_tag_normalizer' => true,
        'phpdoc_line_span' => ['const' => 'single', 'method' => 'multi', 'property' => 'single'],
        'phpdoc_no_access' => true,
        'phpdoc_no_alias_tag' => true,
        'phpdoc_no_empty_return' => true,
        'phpdoc_no_package' => true,
        'phpdoc_no_useless_inheritdoc' => true,
        'phpdoc_order' => true,
        'phpdoc_return_self_reference' => true,
        'phpdoc_scalar' => true,
        'phpdoc_separation' => true,
        'phpdoc_single_line_var_spacing' => true,
        'phpdoc_summary' => true,
        'phpdoc_tag_type' => ['tags' => ['inheritdoc' => 'inline']],
        'phpdoc_to_comment' => true,
        'phpdoc_trim' => true,
        'phpdoc_trim_consecutive_blank_line_separation' => true,
        'phpdoc_types' => true,
        'phpdoc_types_order' => ['null_adjustment' => 'always_last', 'sort_algorithm' => 'none'],
        'phpdoc_var_annotation_correct_order' => true,
        'phpdoc_var_without_name' => true,

        // Return notation
        'no_useless_return' => true,
        'return_assignment' => true,
        'simplified_null_return' => true,

        // Semicolon
        'multiline_whitespace_before_semicolons' => ['strategy' => 'no_multi_line'],
        'no_empty_statement' => true,
        'no_singleline_whitespace_before_semicolons' => true,
        'semicolon_after_instruction' => true,
        'space_after_semicolon' => ['remove_in_empty_for_expressions' => true],

        // Strict
        'declare_strict_types' => true,
        'strict_comparison' => true,
        'strict_param' => true,

        // String notation
        'escape_implicit_backslashes' => true,
        'explicit_string_variable' => true,
        'heredoc_to_nowdoc' => true,
        'no_binary_string' => true,
        'simple_to_complex_string_variable' => true,
        'single_quote' => true,

        // Whitespace
        'blank_line_before_statement' => [
            'statements' => ['break', 'continue', 'declare', 'return', 'throw', 'try'],
        ],
        'compact_nullable_typehint' => true,
        'heredoc_indentation' => true,
        'method_chaining_indentation' => true,
        'no_extra_blank_lines' => [
            'tokens' => [
                'break',
                'continue',
                'extra',
                'return',
                'throw',
                'use',
                'parenthesis_brace_block',
                'square_brace_block',
                'curly_brace_block',
            ],
        ],
        'no_spaces_around_offset' => true,
        'no_spaces_inside_parenthesis' => true,
        'no_whitespace_in_blank_line' => true,
        'single_blank_line_at_eof' => true,
        'types_spaces' => true,

        // WordPress specific rules (when applicable)
        'no_short_echo_tag' => false, // WordPress allows short echo tags
    ])
    ->setFinder($finder)
    ->setUsingCache(true)
    ->setCacheFile(__DIR__ . '/build/.php-cs-fixer.cache');