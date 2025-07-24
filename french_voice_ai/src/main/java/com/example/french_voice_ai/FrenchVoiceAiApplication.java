package com.example.french_voice_ai;

import com.example.french_voice_ai.entitie.Question;
import com.example.french_voice_ai.repository.QuestionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.List;

@SpringBootApplication
public class FrenchVoiceAiApplication {

    public static void main(String[] args) {
        SpringApplication.run(FrenchVoiceAiApplication.class, args);
    }

    @Bean
    CommandLineRunner initDatabase(QuestionRepository questionRepository) {
        return args -> {
            if (questionRepository.count() == 0) {
                List<Question> questions = List.of(
                        new Question(null, "Pouvez-vous vous présenter en quelques phrases ? Décrivez votre parcours, vos compétences en français et vos motivations pour ce poste en centre d'appels.", 1),
                        new Question(null, "Expliquez à un client non spécialiste, en français clair, le principe de fonctionnement d'un panneau photovoltaïque.", 2),
                        new Question(null, "Quelle est la différence entre une pompe à chaleur et un boiler thermique ? Formulez votre réponse comme si vous parliez à un prospect.", 3),
                        new Question(null, "Citez cinq termes techniques liés à nos solutions (photovoltaïque, pompe à chaleur, boiler thermique) et définissez brièvement chacun d'eux.", 4),
                        new Question(null, "Simulation d'appel : un client trouve votre offre de maintenance de pompe à chaleur trop chère. Que lui répondez-vous pour le convaincre de la valeur ajoutée de votre service ?", 5),
                        new Question(null, "Un client mécontent se plaint du délai d'installation trop long. Comment reformulez-vous son problème et quelle solution proposez-vous ?", 6),
                        new Question(null, "Rédigez en français un court email de relance à un prospect qui n'a pas donné suite à votre devis pour l'installation de panneaux solaires.", 7),
                        new Question(null, "Un client vous appelle car son boiler thermique est en panne et il a besoin d'eau chaude immédiatement. Quel processus de prise en charge décrivez-vous ?", 8),
                        new Question(null, "Comment modifiez-vous votre ton et votre vocabulaire selon que votre interlocuteur est un particulier prudent ou un professionnel pressé ? Donnez un exemple de phrase d'accroche pour chacun.", 9),
                        new Question(null, "Simulez un scénario d'appel où vous proposez l’ensemble de nos solutions (photovoltaïque + pompe à chaleur + boiler thermique) à un client intéressé par l’efficacité énergétique de son logement. Structurez votre argumentaire en trois étapes clés.", 10)
                );
                questionRepository.saveAll(questions);
            }
        };
    }
}
