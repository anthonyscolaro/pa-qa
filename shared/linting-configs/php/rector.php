<?php

declare(strict_types=1);

/*
 * Rector Configuration for PA-QA Framework
 * 
 * Automated refactoring rules for PHP 8.1+ with WordPress and Laravel support
 */

use Rector\Config\RectorConfig;
use Rector\Set\ValueObject\LevelSetList;
use Rector\Set\ValueObject\SetList;
use Rector\TypeDeclaration\Rector\ClassMethod\AddVoidReturnTypeWhereNoReturnRector;
use Rector\CodeQuality\Rector\Class_\InlineConstructorDefaultToPropertyRector;
use Rector\CodingStyle\Rector\PostInc\PostIncDecToPreIncDecRector;
use Rector\CodingStyle\Rector\String_\SymplifyQuoteEscapeRector;
use Rector\CodingStyle\Rector\Encapsed\EncapsedStringsToSprintfRector;
use Rector\CodingStyle\Rector\ClassMethod\UnSpreadOperatorRector;
use Rector\DeadCode\Rector\Node\RemoveNonExistingVarAnnotationRector;
use Rector\DeadCode\Rector\Property\RemoveUselessVarDocTagRector;
use Rector\EarlyReturn\Rector\If_\ChangeAndIfToEarlyReturnRector;
use Rector\EarlyReturn\Rector\If_\ChangeOrIfContinueToMultiContinueRector;
use Rector\EarlyReturn\Rector\Return_\PrependNotToInvertedConditionRector;
use Rector\Php74\Rector\Property\TypedPropertyRector;
use Rector\Php80\Rector\FuncCall\ClassOnObjectRector;
use Rector\Php80\Rector\Class_\ClassPropertyAssignToConstructorPromotionRector;
use Rector\Php81\Rector\Property\ReadOnlyPropertyRector;
use Rector\Php81\Rector\ClassConst\FinalizePublicClassConstantRector;
use Rector\Php82\Rector\Class_\ReadOnlyClassRector;
use Rector\TypeDeclaration\Rector\Property\PropertyTypeDeclarationRector;
use Rector\TypeDeclaration\Rector\ClassMethod\AddArrayParamDocTypeRector;
use Rector\TypeDeclaration\Rector\ClassMethod\AddArrayReturnDocTypeRector;

return static function (RectorConfig $rectorConfig): void {
    // Paths to refactor
    $rectorConfig->paths([
        __DIR__ . '/src',
        __DIR__ . '/app',
        __DIR__ . '/tests',
        __DIR__ . '/config',
        __DIR__ . '/database',
        __DIR__ . '/routes',
    ]);

    // Paths to skip
    $rectorConfig->skip([
        __DIR__ . '/vendor',
        __DIR__ . '/node_modules',
        __DIR__ . '/storage',
        __DIR__ . '/bootstrap/cache',
        __DIR__ . '/public',
        __DIR__ . '/build',
        __DIR__ . '/dist',
        '*/migrations/*',
        '*.blade.php',
        '*.min.js',
        '*.min.css',
        
        // Skip specific transformations that might break WordPress/Laravel
        ClassPropertyAssignToConstructorPromotionRector::class => [
            __DIR__ . '/app/Models/*',
            __DIR__ . '/app/Http/Controllers/*',
        ],
        ReadOnlyClassRector::class => [
            __DIR__ . '/app/Models/*',
            __DIR__ . '/app/Http/Controllers/*',
        ],
    ]);

    // PHP version target
    $rectorConfig->phpVersion(80100); // PHP 8.1+

    // Import names
    $rectorConfig->importNames();
    $rectorConfig->importShortClasses(false);

    // Enable parallel processing
    $rectorConfig->parallel();

    // Cache directory
    $rectorConfig->cacheDirectory(__DIR__ . '/build/rector');

    // Rule sets - PHP version upgrades
    $rectorConfig->sets([
        // PHP version sets
        LevelSetList::UP_TO_PHP_81,
        
        // Code quality sets
        SetList::CODE_QUALITY,
        SetList::CODING_STYLE,
        SetList::DEAD_CODE,
        SetList::EARLY_RETURN,
        SetList::TYPE_DECLARATION,
        SetList::PRIVATIZATION,
        SetList::NAMING,
        SetList::INSTANCEOF,
        
        // Framework sets
        SetList::FRAMEWORK_EXTRA_BUNDLE_40,
        SetList::FRAMEWORK_EXTRA_BUNDLE_50,
    ]);

    // Individual rules
    $rectorConfig->rule(InlineConstructorDefaultToPropertyRector::class);
    $rectorConfig->rule(AddVoidReturnTypeWhereNoReturnRector::class);
    $rectorConfig->rule(PostIncDecToPreIncDecRector::class);
    $rectorConfig->rule(SymplifyQuoteEscapeRector::class);
    $rectorConfig->rule(RemoveNonExistingVarAnnotationRector::class);
    $rectorConfig->rule(RemoveUselessVarDocTagRector::class);
    $rectorConfig->rule(ChangeAndIfToEarlyReturnRector::class);
    $rectorConfig->rule(ChangeOrIfContinueToMultiContinueRector::class);
    $rectorConfig->rule(PrependNotToInvertedConditionRector::class);
    $rectorConfig->rule(TypedPropertyRector::class);
    $rectorConfig->rule(ClassOnObjectRector::class);
    $rectorConfig->rule(PropertyTypeDeclarationRector::class);
    $rectorConfig->rule(AddArrayParamDocTypeRector::class);
    $rectorConfig->rule(AddArrayReturnDocTypeRector::class);

    // PHP 8.1+ specific rules
    $rectorConfig->rule(ReadOnlyPropertyRector::class);
    $rectorConfig->rule(FinalizePublicClassConstantRector::class);

    // PHP 8.2+ specific rules (when appropriate)
    // $rectorConfig->rule(ReadOnlyClassRector::class);

    // Configure specific rules
    $rectorConfig->ruleWithConfiguration(ClassPropertyAssignToConstructorPromotionRector::class, [
        // Only promote properties that are simple assignments
        'inline_public' => true,
        'inline_protected' => true,
        'inline_private' => true,
    ]);

    // Skip rules that might break framework compatibility
    $rectorConfig->skip([
        // Skip string concatenation to sprintf (can break readability)
        EncapsedStringsToSprintfRector::class,
        
        // Skip unspread operator (might break array handling)
        UnSpreadOperatorRector::class,
        
        // Skip readonly class for models and controllers
        ReadOnlyClassRector::class => [
            __DIR__ . '/app/Models',
            __DIR__ . '/app/Http/Controllers',
            __DIR__ . '/app/Jobs',
            __DIR__ . '/app/Mail',
            __DIR__ . '/app/Notifications',
        ],
    ]);

    // WordPress specific configurations
    $rectorConfig->skip([
        // Preserve WordPress hooks and global variables
        AddVoidReturnTypeWhereNoReturnRector::class => [
            // WordPress action/filter callbacks often don't return void
            '**/wp-content/plugins/**',
            '**/wp-content/themes/**',
        ],
        
        // WordPress uses many global variables that shouldn't be converted
        PropertyTypeDeclarationRector::class => [
            '**/wp-content/**',
        ],
    ]);

    // Laravel specific configurations
    $rectorConfig->skip([
        // Laravel Eloquent models have magic properties
        TypedPropertyRector::class => [
            __DIR__ . '/app/Models',
        ],
        
        // Laravel uses property injection that shouldn't be promoted
        ClassPropertyAssignToConstructorPromotionRector::class => [
            __DIR__ . '/app/Http/Middleware',
            __DIR__ . '/app/Providers',
        ],
    ]);

    // File extensions to process
    $rectorConfig->fileExtensions(['php']);

    // Bootstrap files for framework compatibility
    $rectorConfig->bootstrapFiles([
        __DIR__ . '/vendor/autoload.php',
    ]);

    // Custom file processor (if needed)
    // $rectorConfig->registerService(CustomFileProcessor::class);

    // Reporting
    $rectorConfig->reportingOutputFormat('table');
    $rectorConfig->reportingShowErrorTable();
};